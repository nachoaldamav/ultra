import chalk from "chalk";
import ora from "ora";
import { writeFile, readFile, unlink } from "node:fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import binLinks from "bin-links";
import { getDeps } from "../utils/getDeps.js";
import { getDepsWorkspaces } from "../utils/getDepsWorkspaces.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import getParamsDeps from "../utils/parseDepsParams.js";
import readConfig from "../utils/readConfig.js";
import parseTime from "../utils/parseTime.js";
import { spinnerGradient } from "../utils/spinnerGradient.js";
import { installPkg } from "../utils/installPkg.js";
import { fnpm_lock } from "../../types/pkg.js";
import manifestFetcher from "../utils/manifestFetcher.js";
import readPackage from "../utils/readPackage.js";
import basePostInstall from "../utils/basePostInstall.js";
import { __dirname } from "../utils/__dirname.js";
import { hardLinkSync } from "../utils/hardLinkSync.js";

type pkg = {
  name: string;
  version: string;
  parent?: string;
};

let pkgs: pkg[] = [];

export const __INSTALLED: {
  name: string;
  version: string;
}[] = [];

export const __DOWNLOADING: string[] = [];
export const __DOWNLOADED: any = [];
export const __SKIPPED: string[] = [];

export const downloadFile = ".fnpm";

const config = readConfig();

export const userFnpmCache = config.cache;
export const REGISTRY = config.registry;

export default async function installBeta(opts: string[]) {
  const start = performance.now();
  const newDeps = opts.filter((opt) => !opt.startsWith("-")).length > 0;

  // Read fnpm.lock file as JSON
  const lockFile: string | null = await readFile(
    path.join(process.cwd(), "fnpm.lock"),
    "utf-8"
  ).catch(() => null);

  const lock = lockFile ? JSON.parse(lockFile) : null;

  if (lock && !newDeps) {
    try {
      const __install = ora({
        text: chalk.green("Installing dependencies..."),
        discardStdin: false,
      }).start();

      const start = performance.now();
      // Hardlink all the packages in fnpm.lock to each path from cache
      await Promise.all(
        Object.keys(lock).map(async (pkg) => {
          // Install depenedencies in parallel using forks
          await Promise.all(
            Object.keys(lock[pkg]).map(async (version) => {
              const pathname = path.join(
                process.cwd(),
                lock[pkg][version].path
              );

              // If version is local, it's a local dependency
              if (version === "local") {
                await installLocalDep({
                  name: pkg,
                  version: pathname,
                }).catch((err) => {
                  ora(chalk.red(`Error installing ${pkg}@${version}`)).fail();
                  throw err;
                });

                return;
              }

              const cache = path.join(userFnpmCache, lock[pkg][version].cache);

              hardLinkSync(cache, pathname);

              const manifest = readPackage(path.join(pathname, "package.json"));

              await binLinks({
                path: pathname,
                pkg: manifest,
                global: false,
                force: true,
              });
            })
          );
        })
      );

      const end = performance.now();
      __install.succeed(
        chalk.green(
          `Installed dependencies in ${chalk.grey(
            parseTime(start, end)
          )} ${chalk.grey("(from lockfile)")}`
        )
      );

      await basePostInstall();
      return;
    } catch (e) {
      ora(chalk.red(`Error: ${e}`)).fail();
      ora(
        chalk.yellow("Lockfile is outdated, installing from cache...")
      ).warn();
      await unlink(path.join(process.cwd(), "fnpm.lock"));
      await installBeta(opts);
      return;
    }
  }

  const addDeps = await getParamsDeps(opts);

  const flag = opts.filter((opt) => opt.startsWith("-"))[0];

  ora(chalk.blue(`Using ${REGISTRY} as registry...`)).info();

  // Read package.json
  const pkg = readPackage("./package.json");

  // Read "workspaces" field
  const workspaces = pkg.workspaces || null;

  const wsDeps = workspaces ? await getDepsWorkspaces(workspaces) : [];

  // Get all dependencies with version
  const deps = getDeps(pkg).concat(wsDeps).concat(addDeps);

  const __fetch = ora(chalk.green("Fetching packages...")).start();
  const __fetch_start = performance.now();

  await Promise.all(
    deps.map(async (dep) => {
      const islocal = dep.version.startsWith("file:");

      if (islocal) {
        __DOWNLOADED.push({
          name: dep.name,
          version: "local",
          path: dep.version,
        });
        await installLocalDep(dep);
        return;
      }
      pkgs.push({
        name: dep.name,
        version: dep.version,
        parent: dep.parent || undefined,
      });
    })
  );

  const __fetch_end = performance.now();
  __fetch.succeed(
    chalk.green(
      `Fetched packages in ${chalk.gray(parseTime(__fetch_start, __fetch_end))}`
    )
  );

  const __install = spinnerGradient(chalk.green("Installing packages..."));
  const __install_start = performance.now();

  await Promise.all(
    pkgs.map(async (pkg) => {
      return await installPkg(pkg, pkg.parent, __install);
    })
  );

  await Promise.all(
    [...new Set(__SKIPPED)].map(async (pkg) => {
      const isInstalled = __INSTALLED.find((i) => i.name === pkg);

      if (!isInstalled) {
        const manifest = await manifestFetcher(`${pkg}@latest`, {
          registry: REGISTRY,
        });

        await installPkg(
          {
            name: pkg,
            version: manifest.version,
            spec: "latest",
            tarball: manifest.dist.tarball,
          },
          undefined,
          __install
        );
      }

      return;
    })
  );

  __install.prefixText = "";
  const __install_end = performance.now();
  __install.succeed(
    chalk.green(
      `Installed packages in ${chalk.gray(
        parseTime(__install_start, __install_end)
      )}`
    )
  );

  // If addDeps is not empty, add them to package.json using flag
  if (addDeps.length > 0) {
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.peerDependencies = pkg.peerDependencies || {};
    pkg.optionalDependencies = pkg.optionalDependencies || {};

    if (flag === "-D" || flag === "--dev") {
      addDeps.forEach((dep) => {
        pkg.devDependencies[dep.name] = dep.version;
      });
    } else if (flag === "-P" || flag === "--peer") {
      addDeps.forEach((dep) => {
        pkg.peerDependencies[dep.name] = dep.version;
      });
    } else if (flag === "-O" || flag === "--optional") {
      addDeps.forEach((dep) => {
        pkg.optionalDependencies[dep.name] = dep.version;
      });
    } else {
      addDeps.forEach((dep) => {
        pkg.dependencies[dep.name] = dep.version;
      });
    }

    // Remove duplicates from other dep types
    addDeps.forEach((dep) => {
      if (flag !== "-D" && flag !== "--dev")
        delete pkg.devDependencies[dep.name];

      if (flag !== "-P" && flag !== "--peer")
        delete pkg.peerDependencies[dep.name];

      if (flag !== "-O" && flag !== "--optional")
        delete pkg.optionalDependencies[dep.name];

      if (flag) delete pkg.dependencies[dep.name];
    });

    // Remove empty objects
    if (Object.keys(pkg.dependencies).length === 0) delete pkg.dependencies;

    if (Object.keys(pkg.devDependencies).length === 0)
      delete pkg.devDependencies;

    if (Object.keys(pkg.peerDependencies).length === 0)
      delete pkg.peerDependencies;

    if (Object.keys(pkg.optionalDependencies).length === 0)
      delete pkg.optionalDependencies;

    await writeFile(
      path.join(process.cwd(), "package.json"),
      JSON.stringify(pkg, null, 2),
      "utf-8"
    );
  }

  const downloadedPkgs: fnpm_lock = {};

  __DOWNLOADED.forEach((pkg: any) => {
    if (!downloadedPkgs[pkg.name]) {
      downloadedPkgs[pkg.name] = {};
    }

    downloadedPkgs[pkg.name][pkg.version] = {
      path: pkg.path,
      cache: pkg.cache,
      tarball: pkg.tarball,
    };

    return;
  });

  if (__DOWNLOADED.length > 0) {
    await writeFile(
      path.join(process.cwd(), "fnpm.lock"),
      JSON.stringify(downloadedPkgs, null, 2),
      "utf-8"
    );
  } else {
    ora(chalk.red("No packages were downloaded.")).warn();
  }

  await basePostInstall();

  ora(
    chalk.green(`Done in ${chalk.gray(parseTime(start, performance.now()))}`)
  ).succeed();

  process.exit();
}
