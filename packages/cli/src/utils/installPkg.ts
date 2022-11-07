import chalk from "chalk";
import ora, { Ora } from "ora";
import readPackage from "./readPackage.js";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
} from "node:fs";
import path from "path";
import semver from "semver";
import binLinks from "bin-links";
import { getDeps } from "./getDeps.js";
import manifestFetcher from "./manifestFetcher.js";
import { hardLinkSync } from "./hardLinkSync.js";
import { ultraExtract } from "./extract.js";
import { gitInstall } from "./gitInstaller.js";
import { getDir } from "./getInstallableDir.js";
import { sleep } from "./sleep.js";
import getVersions from "./getVersions.js";
import { checkDist } from "./checkDist.js";

type Return = {
  name: string;
  version: string;
  tarball: string;
  spec: string;
  integrity: string;
  parent?: string;
};

export async function installPkg(
  manifest: any,
  parent?: string,
  spinner?: Ora
): Promise<Return | null | void> {
  // Skip * versions
  if (manifest.version === "*") {
    __SKIPPED.push(manifest.name);
    return null;
  }

  if (manifest.optional) {
    const suitable = checkDist(manifest.name);
    if (!suitable) {
      const pkg = await manifestFetcher(
        `${manifest.name}@${manifest.version}`,
        {
          registry: REGISTRY,
        }
      );

      if (!pkg) return null;

      __DOWNLOADED.push({
        name: manifest.name,
        version: pkg.version,
        tarball: pkg.dist.tarball,
        integrity: pkg.dist.integrity,
        path: path.join("/node_modules", manifest.name),
        cache: "/" + path.join(manifest.name, pkg.version),
        optional: true,
      });

      return {
        name: manifest.name,
        version: pkg.version,
        tarball: pkg.dist.tarball,
        spec: manifest.version,
        integrity: pkg.dist.integrity,
      };
    }
  }

  if (manifest.version.startsWith("git")) {
    return gitInstall(manifest, parent, spinner);
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
    localManifest?.version &&
    semver.satisfies(localManifest.version, manifest.version)
  ) {
    return null;
  }

  if (spinner) {
    spinner.prefixText = "🔍";
    spinner.text = chalk.green(`${manifest.name}@${manifest.version}`);
  }

  let cacheFolder;

  const installedVersions = getVersions(manifest.name);

  const suitableVersion = installedVersions.find((version) =>
    semver.satisfies(version, manifest.version)
  );

  if (suitableVersion) {
    cacheFolder = path.join(userUltraCache, manifest.name, suitableVersion);
  }

  let pkgProjectDir = getDir(manifest, parent, islocalInstalled);

  if (!pkgProjectDir) {
    return null;
  }

  const isSatisfied = cacheFolder
    ? existsSync(path.join(cacheFolder, downloadFile))
    : false;

  if (isSatisfied && cacheFolder && manifest.version !== "latest") {
    if (spinner) {
      spinner.prefixText = "📦";
      spinner.text = chalk.green(
        `${manifest.name}@${manifest.version}` + chalk.gray(" (cached)")
      );
    }

    if (existsSync(pkgProjectDir)) {
      pkgProjectDir = path.join(
        parent || process.cwd(),
        "node_modules",
        manifest.name
      );
    }

    // Push to downloaded package info
    __DOWNLOADED.push({
      name: manifest.name,
      version: suitableVersion,
      path: pkgProjectDir.replace(process.cwd(), ""),
      cache: cacheFolder.replace(userUltraCache, ""),
      tarball: manifest.tarball,
      integrity: manifest.integrity,
    });

    // Create directory for package without the last folder
    mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
    hardLinkSync(cacheFolder, pkgProjectDir);

    try {
      const pkgJson = readPackage(path.join(cacheFolder, "package.json"));

      // Get deps from file
      const cachedDeps = JSON.parse(
        readFileSync(`${cacheFolder}/${downloadFile}`, "utf-8")
      );

      const deps = getDeps(pkgJson, {
        dev: true,
      });

      // Symlink bin files
      await binLinks({
        path: pkgProjectDir,
        pkg: pkgJson,
        global: false,
        force: true,
      });

      // Push post install script
      const postinstall = pkgJson.scripts?.postinstall;
      if (postinstall && !__NOPOSTSCRIPTS) {
        __POSTSCRIPTS.push({
          package: pkgJson.name,
          script: postinstall,
          scriptPath: pkgProjectDir,
          cachePath: cacheFolder,
        });
      }

      // Install deps
      for (const dep of Object.keys(cachedDeps)) {
        const name = dep;
        const version = Object.keys(cachedDeps[dep])[0];

        await installPkg(
          {
            name,
            version,
            tarball: cachedDeps[dep][version].tarball || "",
          },
          pkgProjectDir,
          spinner
        );
      }

      for (const dep of deps) {
        if (!cachedDeps[dep.name]) {
          await installPkg(dep, pkgProjectDir, spinner);
        }
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

  if (
    __INSTALLED.find((e) => e.name === pkg.name && e.version === pkg.version)
  ) {
    return null;
  }

  cacheFolder = path.join(userUltraCache, pkg.name, pkg.version);

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

  const status = await ultraExtract(
    cacheFolder,
    pkg.dist.tarball,
    pkg.dist.integrity,
    pkg.name
  );

  if (status && status.res === "skipped") {
    while (__DOWNLOADING.includes(pkg.dist.tarball)) {
      await sleep(100);
    }
  }

  if (pkg.deprecated) {
    ora(
      `${chalk.bgYellow.black("[DEPR]")} ${chalk.yellow(
        `${manifest.name}@${manifest.version}`
      )} - ${pkg.deprecated}`
    ).warn();
  }

  const pkgJson = readPackage(path.join(cacheFolder, "package.json"));

  if (existsSync(pkgProjectDir)) {
    // If exists, retry
    const parentDir = parent ? parent : process.cwd();
    pkgProjectDir = path.join(parentDir, "node_modules", manifest.name);
  }

  if (existsSync(pkgProjectDir)) {
    const pkgJson = readPackage(path.join(pkgProjectDir, "package.json"));

    if (semver.satisfies(pkgJson.version, pkg.version)) {
      return null;
    }

    return installPkg(manifest, parent, spinner);
  }

  // Push to downloaded package info
  __DOWNLOADED.push({
    name: manifest.name,
    version: pkg.version,
    path: pkgProjectDir.replace(process.cwd(), ""),
    cache: cacheFolder.replace(userUltraCache, ""),
    tarball: pkg.dist.tarball,
    integrity: pkg.dist.integrity,
    optional: manifest.optional || false,
  });

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
            optional: dep.optional || false,
          },
          pkgProjectDir as string,
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
    let object: { [key: string]: any } = {
      "ultra:self": {
        name: pkg.name,
        version: pkg.version,
        tarball: pkg.dist.tarball,
        integrity: pkg.dist.integrity,
        path: cacheFolder,
      },
    };

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
    const postinstall = pkgJson?.scripts?.postinstall || null;
    if (postinstall) {
      __POSTSCRIPTS.push({
        package: pkg.name,
        scriptPath: pkgProjectDir,
        cachePath: cacheFolder,
        script: postinstall,
      });
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
      integrity: pkg.dist.integrity,
    };
  } catch (error: any) {
    ora(
      chalk.red(
        `[ERR] ${chalk.bgRedBright.black(
          `${manifest.name}@${manifest.version}`
        )} - ${error.message} - ${error.lineNumber}`
      )
    ).fail();

    return {
      name: manifest.name,
      version: pkg.version,
      tarball: pkg.dist.tarball,
      spec: manifest.version,
      integrity: pkg.dist.integrity,
    };
  }
}
