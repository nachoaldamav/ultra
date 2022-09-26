import chalk from "chalk";
import ora, { Ora } from "ora";
import rpjf from "read-package-json-fast";
import { mkdir, readdir, writeFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { existsSync, readFileSync } from "fs";
import pacote from "pacote";
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

export async function installPkg(
  manifest: any,
  parent?: string,
  spinner?: Ora
) {
  const cacheFolder = `${userFnpmCache}/${manifest.name}/${manifest.version}`;

  // Check if spec is * and add it to __SKIPPED
  if (manifest.spec === "*") {
    __SKIPPED.push(manifest.name);
    return;
  }

  // Check if package is already in root node_modules
  const isInRoot = existsSync(
    path.join(process.cwd(), "node_modules", manifest.name)
  );

  const getDir = () => {
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
    const pkg = JSON.parse(
      readFileSync(path.join(dir, "package.json"), "utf-8")
    );

    if (semver.satisfies(pkg.version, manifest.spec)) {
      return dir;
    }

    return path.join(parent, "node_modules", manifest.name);
  };

  const pkgProjectDir = getDir();

  if (existsSync(pkgProjectDir)) return;

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
    return;
  }

  if (!isInRoot) {
    __INSTALLED.push({
      name: manifest.name,
      version: manifest.version,
    });
  }

  // Check if parent exists
  if (parent) {
    if (!existsSync(`${parent}/node_modules`)) {
      await mkdir(`${parent}/node_modules`, { recursive: true });
    }
  }

  let savedDeps: any[] | null = null;

  // Check if package is already in cache, searching for file .fnpm
  if (existsSync(`${cacheFolder}/${downloadFile}`)) {
    if (spinner)
      spinner.text = chalk.green(
        `Installing ${manifest.name}... ${chalk.grey("(cached)")}`
      );

    // Create directory for package without the last folder
    const dirs = pkgProjectDir.split("/");
    dirs.pop();
    await mkdir(dirs.join("/"), { recursive: true });
    await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});

    // Get deps from file
    const cachedDeps = JSON.parse(
      readFileSync(`${cacheFolder}/${downloadFile}`, "utf-8")
    );

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
    __DOWNLOADED.push({
      name: manifest.name,
      version: manifest.version,
      path: pkgProjectDir.replace(process.cwd(), ""),
      cache: cacheFolder.replace(userFnpmCache, ""),
    });
  } else {
    if (spinner)
      spinner.text = chalk.green(
        `Installing ${manifest.name}... ${chalk.grey("(cache miss)")}`
      );
    await extract(cacheFolder, manifest.tarball);

    // Create directory for package without the last folder
    const dirs = pkgProjectDir.split("/");
    dirs.pop();
    await mkdir(dirs.join("/"), { recursive: true });
    await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});

    // Get production deps
    try {
      const pkg = await rpjf(`${cacheFolder}/package.json`);
      if (!savedDeps) {
        const deps = getDeps(pkg, {
          dev: true,
        });

        // Install production deps
        const installed = await Promise.all(
          deps.map(async (dep) => {
            const manifest = await pacote.manifest(
              `${dep.name}@${dep.version}`,
              {
                registry: REGISTRY,
              }
            );

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

        await writeFile(
          `${cacheFolder}/${downloadFile}`,
          JSON.stringify(object, null, 2),
          "utf-8"
        );

        // Execute postinstall script if exists
        const postinstall = pkg.scripts.postinstall;
        if (postinstall) {
          const postinstallPath = path.join(cacheFolder, "node_modules", ".");
          const postinstallScript = path.join(postinstallPath, postinstall);

          if (existsSync(postinstallScript)) {
            exec(`${postinstallScript}`, {
              cwd: postinstallPath,
            });
          }
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

        return;
      } else {
        // Execute postinstall script if exists
        const postinstall = pkg.scripts.postinstall;
        if (postinstall) {
          const postinstallPath = path.join(cacheFolder, "node_modules", ".");
          const postinstallScript = path.join(postinstallPath, postinstall);

          if (existsSync(postinstallScript)) {
            exec(`${postinstallScript}`, {
              cwd: postinstallPath,
            });
          }
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
        return;
      }
    } catch (error: any) {
      return;
    }
  }
}
