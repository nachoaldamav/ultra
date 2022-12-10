import type { ultra_lock } from "../../types/pkg";
import chalk from "chalk";
import ora from "ora";
import { writeFile, readFile, unlink, rm } from "node:fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import semver from "semver";
import { getDeps } from "../utils/getDeps.js";
import { getDepsWorkspaces } from "../utils/getDepsWorkspaces.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import getParamsDeps from "../utils/parseDepsParams.js";
import parseTime from "../utils/parseTime.js";
import { spinnerGradient } from "../utils/spinnerGradient.js";
import manifestFetcher from "../utils/manifestFetcher.js";
import readPackage from "../utils/readPackage.js";
import basePostInstall from "../utils/basePostInstall.js";
import { __dirname } from "../utils/__dirname.js";
import { executePost } from "../utils/postInstall.js";
import { installLock } from "../utils/installLock.js";
import { genLock } from "../utils/genLockfile.js";

__NOPOSTSCRIPTS = process.argv.includes("--ignore-scripts");

export async function install(opts: string[]) {
  const start = performance.now();
  const newDeps = opts.filter((opt) => !opt.startsWith("-")).length > 0;

  // Read ultra.lock file as JSON
  const lockFile: string | null = await readFile(
    path.join(process.cwd(), "ultra.lock"),
    "utf8"
  ).catch(() => null);

  const lock = lockFile ? JSON.parse(lockFile) : null;

  if (lock && !newDeps) {
    try {
      await installLock(lock);
      return;
    } catch (e) {
      ora(chalk.red(`${e}`)).fail();
      ora(
        chalk.yellow("Lockfile is outdated, installing from cache...")
      ).warn();
      await unlink(path.join(process.cwd(), "ultra.lock"));
      await install(opts);
      return;
    }
  }

  const addDeps = await getParamsDeps(opts);

  const flag = opts.filter((opt) => opt.startsWith("-"))[0];

  ora(chalk.blue(`Using ${REGISTRY} as registry...`)).info();
  ora(chalk.blue(`Using ${userUltraCache} as cache directory...`)).info();

  // Read package.json
  const pkg = readPackage("./package.json");

  // Read "workspaces" field
  const workspaces = pkg.workspaces || null;

  const ws = await getDepsWorkspaces(workspaces);

  const wsDeps = ws && ws.deps.length > 0 ? ws.deps : [];
  const wsPkgs = ws && ws.pkgs.length > 0 ? ws.pkgs : [];

  // Get all dependencies with version
  const deps = getDeps(pkg).concat(wsDeps).concat(addDeps);

  const __fetch = ora(chalk.green("Installing local packages...")).start();
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

      // If dependency is inside wsPkgs, it's a local dependency
      const localAvailable = wsPkgs.find((wsPkg) => wsPkg.name === dep.name);

      if (localAvailable) {
        __DOWNLOADED.push({
          name: dep.name,
          version: "local",
          path: localAvailable.version,
        });
        await installLocalDep({
          name: dep.name,
          version: localAvailable.version,
        });
        return;
      }

      pkgs.push({
        name: dep.name,
        version: dep.version,
        parent: dep.parent || undefined,
        optional: dep.optional || false,
        fromMonorepo: dep.parent ? dep.parent : undefined,
      });
    })
  );

  const __fetch_end = performance.now();

  __fetch.text = chalk.green(
    `Installed local packages in ${chalk.gray(
      parseTime(__fetch_start, __fetch_end)
    )}`
  );

  __fetch.stopAndPersist({
    symbol: chalk.green("⚡"),
  });

  const { installPkg } = await import("../utils/installPkg.js");

  const __install = spinnerGradient(chalk.green("Installing packages..."));
  const __install_start = performance.now();

  await Promise.all(
    pkgs.map(async (pkg) => {
      return installPkg(pkg, pkg.parent, __install);
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

  __install.text = chalk.green(
    `Installed packages in ${chalk.gray(
      parseTime(__install_start, __install_end)
    )}`
  );

  __install.stopAndPersist({
    symbol: chalk.green("⚡"),
  });

  if (__POSTSCRIPTS.length > 0) {
    const __postinstall = ora(
      chalk.gray("Running postinstall scripts...")
    ).start();
    const __postinstall_start = performance.now();

    await Promise.all(
      __POSTSCRIPTS.map(async (script) => {
        __postinstall.text = chalk.gray(
          `Running ${chalk.blueBright(script.package)}...`
        );
        try {
          await executePost(script.script, script.scriptPath, script.cachePath);
        } catch (e) {
          ora(
            chalk.red(`Error with ${script.package} postinstall script - ${e}`)
          ).fail();
          return;
        }
      })
    );

    const __postinstall_end = performance.now();
    __postinstall.text = chalk.green(
      `${__POSTSCRIPTS.length} Post Install scripts completed in ${chalk.gray(
        parseTime(__postinstall_start, __postinstall_end)
      )}`
    );

    __postinstall.stopAndPersist({
      symbol: chalk.green("⚡"),
    });
  }

  await basePostInstall();

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

  const downloadedPkgs: ultra_lock = {};

  __DOWNLOADED
    .sort((a, b) => {
      // Sort by name and then by version using semver
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (semver.lt(a.version, b.version)) return -1;
      if (semver.gt(a.version, b.version)) return 1;
      return 0;
    })
    .forEach((pkg: any) => {
      if (!downloadedPkgs[pkg.name]) {
        downloadedPkgs[pkg.name] = {};
      }

      downloadedPkgs[pkg.name][pkg.version] = {
        path: pkg.path,
        cache: pkg.cache,
        tarball: pkg.tarball,
        integrity: pkg.integrity,
        optional: pkg.optional,
      };

      return;
    });

  if (
    __DOWNLOADED.filter((pkg) => pkg.version !== "local").length > 0 &&
    !newDeps
  ) {
    await writeFile(
      path.join(process.cwd(), "ultra.lock"),
      JSON.stringify(downloadedPkgs, null, 2),
      "utf-8"
    );
  } else {
    if (__DOWNLOADED.length === 0)
      ora(chalk.red("No packages were downloaded.")).warn();
    genLock();
  }

  if (__VERIFIED.length > 0) {
    const verify = ora(
      chalk.green(`${chalk.gray(__VERIFIED.length)} packages verified`)
    ).start();

    verify.stopAndPersist({
      symbol: chalk.green("⚡"),
    });
  }

  const __done = ora(
    chalk.green(`Done in ${chalk.gray(parseTime(start, performance.now()))}`)
  ).start();

  __done.stopAndPersist({
    symbol: chalk.green("⚡"),
  });

  process.exit(0);
}
