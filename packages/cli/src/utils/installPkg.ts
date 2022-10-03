import chalk from "chalk";
import ora, { Ora } from "ora";
import readPackage from "./readPackage.js";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  chmodSync,
} from "node:fs";
import { exec } from "child_process";
import path from "path";
import semver from "semver";
import { getDeps } from "../utils/getDeps.js";
import { hardLink } from "../utils/hardLink.js";
import {
  userFnpmCache,
  __DOWNLOADED,
  REGISTRY,
  __DOWNLOADING,
  __INSTALLED,
  __SKIPPED,
  downloadFile,
} from "../commands/install.js";
import { extract } from "./extract.js";
import manifestFetcher from "./manifestFetcher.js";

export async function installPkg(
  manifest: any,
  parent?: string,
  spinner?: Ora
): Promise<any> {
  const cacheFolder = `${userFnpmCache}/${manifest.name}/${manifest.version}`;

  // Check if spec is * and add it to __SKIPPED
  if (manifest.spec === "*") {
    __SKIPPED.push(manifest.name);
    return;
  }

  if (
    __INSTALLED.find(
      (pkg) => pkg.name === manifest.name && pkg.version === manifest.version
    )
  ) {
    return;
  }

  const pkgInstalled =
    manifest.spec &&
    __INSTALLED.find(
      (pkg) =>
        pkg.name === manifest.name &&
        semver.satisfies(pkg.version, manifest.spec)
    );

  if (pkgInstalled) {
    if (spinner) {
      spinner.text = chalk.green(
        `Skipping ${manifest.name}@${manifest.spec} as it's satisfied by ${pkgInstalled.version}`
      );
    }
    return;
  }

  // Check if package is already in root node_modules
  const isInRoot = existsSync(
    path.join(process.cwd(), "node_modules", manifest.name)
  );

  const getDir = () => {
    try {
      if (!isInRoot || !parent) {
        return path.join(process.cwd(), "node_modules", manifest.name);
      }

      // Check how many node_modules are in the path
      const count = parent.split("node_modules").length - 1;
      if (count === 1) {
        return path.join(parent, "node_modules", manifest.name);
      }

      // Check if the dir exists in previous node_modules
      const dir = path.join(
        process.cwd(),
        "node_modules",
        parent.split("node_modules")[1],
        "node_modules",
        manifest.name
      );

      if (!existsSync(dir)) {
        return dir;
      }

      // If it exists, check if the version is suitable with manifest.spec
      const pkg = readPackage(path.join(dir, "package.json"));

      if (semver.satisfies(pkg.version, manifest.spec)) {
        return dir;
      }

      return path.join(parent, "node_modules", manifest.name);
    } catch (e) {
      return parent
        ? path.join(parent, "node_modules", manifest.name)
        : path.join(process.cwd(), "node_modules", manifest.name);
    }
  };

  const pkgProjectDir = getDir();

  if (existsSync(pkgProjectDir)) return;

  if (!isInRoot) {
    __INSTALLED.push({
      name: manifest.name,
      version: manifest.version,
    });
  }

  // Push to downloaded package info
  __DOWNLOADED.push({
    name: manifest.name,
    version: manifest.version,
    // Remove cwd from path
    path: pkgProjectDir.replace(process.cwd(), ""),
    // Remove homeDir from path
    cache: cacheFolder.replace(userFnpmCache, ""),
  });

  // Check if package is already in cache, searching for file .fnpm
  if (existsSync(`${cacheFolder}/${downloadFile}`)) {
    if (spinner)
      spinner.text = chalk.green(
        `Installing ${manifest.name}... ${chalk.grey("(cached)")}`
      );

    // Create directory for package without the last folder
    mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
    await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});

    const pkg = readPackage(path.join(pkgProjectDir, "package.json"));

    // Get deps from file
    const cachedDeps = JSON.parse(
      readFileSync(`${cacheFolder}/${downloadFile}`, "utf-8")
    );

    // Symlink bin files
    const bins = pkg.bin;
    if (bins) {
      for (const bin of Object.keys(bins)) {
        try {
          const binPath = path.join(pkgProjectDir, bins[bin]);
          const binLink = path.join(process.cwd(), "node_modules", ".bin", bin);

          if (existsSync(binPath)) {
            mkdirSync(path.dirname(binLink), { recursive: true });
            symlinkSync(binPath, binLink);
            chmodSync(binPath, 0o755);
          }
        } catch (e) {}
      }
    }

    for (const dep of Object.keys(cachedDeps)) {
      const name = dep;
      const version = Object.keys(cachedDeps[dep])[0];
      const { tarball, spec } = cachedDeps[dep][version];

      await installPkg(
        {
          name,
          version,
          tarball,
          spec,
        },
        pkgProjectDir,
        spinner
      );
    }
  } else {
    if (spinner) {
      spinner.text = chalk.green(
        `Installing ${manifest.name}... ${chalk.grey("(cache miss)")}`
      );
    }

    const status = await extract(cacheFolder, manifest.tarball);

    if (status.res === "skipped") {
      return;
    }

    // Create directory for package without the last folder
    mkdirSync(path.dirname(pkgProjectDir), { recursive: true });

    await hardLink(cacheFolder, pkgProjectDir).catch((e) => {
      throw new Error(e);
    });

    // Get production deps
    try {
      const pkg = readPackage(`${cacheFolder}/package.json`);

      const deps = getDeps(pkg, {
        dev: true,
      });

      // Install production deps
      const installed = await Promise.all(
        deps.map(async (dep) => {
          const manifest = await manifestFetcher(`${dep.name}@${dep.version}`, {
            registry: REGISTRY,
          });

          if (manifest.deprecated) {
            ora(
              `[DEPR] ${chalk.bgYellowBright.black(
                manifest.name + "@" + manifest.version
              )} - ${manifest.deprecated}`
            ).warn();
          }

          await installPkg(
            {
              name: dep.name,
              version: manifest.version,
              tarball: manifest.dist.tarball,
              spec: dep.version,
            },
            pkgProjectDir,
            spinner
          );

          return {
            name: dep.name,
            version: manifest.version,
            spec: dep.version,
            tarball: manifest.dist.tarball,
            path: path.join(userFnpmCache, dep.name, manifest.version),
          };
        })
      );

      // Save installed deps with its path in .fnpm file as objects
      let object: { [key: string]: any } = {};

      installed.forEach((dep) => {
        object[dep.name] = {
          [dep.version]: {
            path: dep.path,
            tarball: dep.tarball,
            spec: dep.spec,
          },
        };
      });

      writeFileSync(
        `${cacheFolder}/${downloadFile}`,
        JSON.stringify(object, null, 2),
        "utf-8"
      );

      // Execute postinstall script if exists
      const postinstall = pkg?.scripts?.postinstall || null;
      if (postinstall) {
        const postinstallPath = path.join(cacheFolder, "node_modules", ".");
        const postinstallScript = path.join(postinstallPath, postinstall);

        if (existsSync(postinstallScript)) {
          exec(`${postinstallScript}`, {
            cwd: postinstallPath,
          });
        }
      }

      // Symlink bin files
      const bins = pkg?.bin || null;
      if (bins) {
        for (const bin of Object.keys(bins)) {
          try {
            const binPath = path.join(pkgProjectDir, bins[bin]);
            const binLink = path.join(
              process.cwd(),
              "node_modules",
              ".bin",
              bin
            );

            if (existsSync(binPath)) {
              mkdirSync(path.dirname(binLink), { recursive: true });
              symlinkSync(binPath, binLink);
              chmodSync(binPath, 0o755);
            }
          } catch (e: any) {
            // If error is EEEXIST, ignore
            if (e.code !== "EEXIST") throw e;
          }
        }
      }

      return;
    } catch (error: any) {
      if (error.message.includes("ENOENT")) {
        return await installPkg(
          {
            name: manifest.name,
            version: manifest.version,
            tarball: manifest.tarball,
            spec: manifest.spec,
          },
          parent,
          spinner
        );
      }

      ora(
        chalk.red(
          `[ERR] ${chalk.bgRedBright.black(
            `${manifest.name}@${manifest.version}`
          )} - ${error.message}`
        )
      ).fail();

      return;
    }
  }
}
