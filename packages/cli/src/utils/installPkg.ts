import chalk from "chalk";
import ora, { Ora } from "ora";
import readPackage from "./readPackage.js";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { exec } from "child_process";
import path from "path";
import semver from "semver";
import binLinks from "bin-links";
import { getDeps } from "./getDeps.js";
import {
  userUltraCache,
  __DOWNLOADED,
  REGISTRY,
  __DOWNLOADING,
  __INSTALLED,
  __SKIPPED,
  downloadFile,
} from "../commands/install.js";
import manifestFetcher from "./manifestFetcher.js";
import { hardLinkSync } from "./hardLinkSync.js";
import { ultraExtract } from "./pkgDownloader.js";

type Return = {
  name: string;
  version: string;
  tarball: string;
  parent?: string;
  spec: string;
};

export async function installPkg(
  manifest: any,
  parent?: string,
  spinner?: Ora
): Promise<Return | null> {
  // Skip * versions
  if (manifest.version === "*") {
    __SKIPPED.push(manifest.name);
    return null;
  }

  // Check if package is already installed in node_modules
  const islocalInstalled = existsSync(
    path.join(process.cwd(), "node_modules", manifest.name, "package.json")
  );

  const localManifest = islocalInstalled
    ? readPackage(
        path.join(process.cwd(), "node_modules", manifest.name, "package.json")
      )
    : null;

  if (
    localManifest &&
    semver.satisfies(localManifest.version, manifest.version)
  ) {
    return null;
  }

  if (spinner) {
    spinner.prefixText = "🔍";
    spinner.text = chalk.green(`${manifest.name}@${manifest.version}`);
  }

  let cacheFolder;

  const installedVersions = existsSync(path.join(userUltraCache, manifest.name))
    ? readdirSync(path.join(userUltraCache, manifest.name))
    : [];

  const suitableVersion = installedVersions.find((version) =>
    semver.satisfies(version, manifest.version)
  );

  if (suitableVersion) {
    cacheFolder = path.join(userUltraCache, manifest.name, suitableVersion);
  }

  function getDir() {
    try {
      if (!islocalInstalled || !parent) {
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
  }

  const pkgProjectDir = getDir();

  if (existsSync(pkgProjectDir)) {
    return null;
  }

  const isSatisfied = cacheFolder
    ? existsSync(path.join(cacheFolder, downloadFile))
    : false;

  if (isSatisfied && cacheFolder && manifest.version !== "latest") {
    // Push to downloaded package info
    __DOWNLOADED.push({
      name: manifest.name,
      version: suitableVersion,
      // Remove cwd from path
      path: pkgProjectDir.replace(process.cwd(), ""),
      // Remove homeDir from path
      cache: cacheFolder.replace(userUltraCache, ""),
    });

    if (spinner) {
      spinner.prefixText = "📦";
      spinner.text = chalk.green(
        `${manifest.name}@${manifest.version}` + chalk.gray(" (cached)")
      );
    }

    // Create directory for package without the last folder
    mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
    hardLinkSync(cacheFolder, pkgProjectDir);

    try {
      const pkgJson = readPackage(path.join(cacheFolder, "package.json"));

      // Get deps from file
      const cachedDeps = JSON.parse(
        readFileSync(`${cacheFolder}/${downloadFile}`, "utf-8")
      );

      // Symlink bin files
      await binLinks({
        path: pkgProjectDir,
        pkg: pkgJson,
        global: false,
        force: true,
      });

      // Install deps
      for (const dep of Object.keys(cachedDeps)) {
        const name = dep;
        const version = Object.keys(cachedDeps[dep])[0];

        await installPkg(
          {
            name,
            version,
          },
          pkgProjectDir,
          spinner
        );
      }

      __INSTALLED.push({
        name: manifest.name,
        version: manifest.version,
      });

      if (manifest.fromMonorepo !== undefined) {
        try {
          // Symlink pkgProjectDir to "fromMonorepo" folder
          mkdirSync(
            path.dirname(
              path.join(manifest.fromMonorepo, "node_modules", manifest.name)
            ),
            {
              recursive: true,
            }
          );
          symlinkSync(
            pkgProjectDir,
            path.join(manifest.fromMonorepo, "node_modules", manifest.name)
          );
        } catch (e) {}
      }

      return null;
    } catch (e: any) {
      ora(
        chalk.red(
          `Error while installing ${manifest.name}@${manifest.version} from cache - ${e.message}`
        )
      ).fail();
      return null;
    }
  }

  // Fetch manifest
  const pkg = await manifestFetcher(`${manifest.name}@${manifest.version}`, {
    registry: REGISTRY,
  });

  cacheFolder = path.join(userUltraCache, pkg.name, pkg.version);

  if (
    __INSTALLED.find((e) => e.name === pkg.name && e.version === pkg.version)
  ) {
    return null;
  }

  if (!islocalInstalled) {
    __INSTALLED.push({
      name: manifest.name,
      version: pkg.version,
    });
  }

  if (spinner) {
    spinner.prefixText = "📦";
    spinner.text = chalk.green(
      `${manifest.name}@${manifest.version}` + chalk.gray(" (cache miss)")
    );
  }

  const status = await ultraExtract(cacheFolder, pkg.dist.tarball);

  const pkgJson = readPackage(path.join(cacheFolder, "package.json"));

  if (status.res === "skipped") {
    return null;
  }

  // Create directory for package without the last folder
  mkdirSync(path.dirname(pkgProjectDir), { recursive: true });

  hardLinkSync(cacheFolder, pkgProjectDir);

  if (manifest.fromMonorepo !== undefined) {
    try {
      // Symlink pkgProjectDir to "fromMonorepo" folder
      mkdirSync(
        path.dirname(
          path.join(manifest.fromMonorepo, "node_modules", manifest.name)
        ),
        {
          recursive: true,
        }
      );
      symlinkSync(
        pkgProjectDir,
        path.join(manifest.fromMonorepo, "node_modules", manifest.name)
      );
    } catch (e) {}
  }

  // Get production deps
  try {
    const deps = getDeps(pkg, {
      dev: true,
    });

    // Install production deps
    const installed = await Promise.all(
      deps.map(async (dep) => {
        const data = await installPkg(
          {
            name: dep.name,
            version: dep.version,
          },
          pkgProjectDir,
          spinner
        );

        if (!data) return null;

        return {
          name: dep.name,
          version: data.version,
          tarball: data.tarball,
          path: path.join(userUltraCache, dep.name, data.version),
        };
      })
    );

    // Remove null values
    const filtered = installed.filter((i) => i);

    // Save installed deps with its path in .ultra file as objects
    let object: { [key: string]: any } = {};

    filtered.forEach((dep) => {
      if (dep)
        object[dep.name] = {
          [dep.version]: {
            path: dep.path,
            tarball: dep.tarball,
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
    await binLinks({
      path: pkgProjectDir,
      pkg: pkgJson,
      global: false,
      force: true,
    });

    return {
      name: manifest.name,
      version: pkg.version,
      tarball: pkg.dist.tarball,
      spec: manifest.version,
    };
  } catch (error: any) {
    ora(
      chalk.red(
        `[ERR] ${chalk.bgRedBright.black(
          `${manifest.name}@${manifest.version}`
        )} - ${error.message}`
      )
    ).fail();

    return {
      name: manifest.name,
      version: pkg.version,
      tarball: pkg.dist.tarball,
      spec: manifest.version,
    };
  }
}
