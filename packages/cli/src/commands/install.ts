import chalk from "chalk";
import ora, { Ora } from "ora";
import rpjf from "read-package-json-fast";
import { mkdir, rm, readdir, writeFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { existsSync, readFileSync } from "fs";
import pacote from "pacote";
import { performance } from "perf_hooks";
import { satisfies } from "compare-versions";
import { getDeps } from "../utils/getDeps.js";
import { installBins } from "../utils/addBinaries.js";
import { getDepsWorkspaces } from "../utils/getDepsWorkspaces.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import { createModules } from "../utils/createModules.js";
import { hardLink } from "../utils/hardLink.js";
import getParamsDeps from "../utils/parseDepsParams.js";
import readWasm from "../utils/readWasm.js";
import readConfig from "../utils/readConfig.js";
import parseTime from "../utils/parseTime.js";

type pkg = {
  name: string;
  version: string;
  spec: string;
  tarball: string;
  parent?: string;
};

let pkgs: pkg[] = [];

const __INSTALLED: {
  name: string;
  version: string;
}[] = [];

const __DOWNLOADING: string[] = [];
const __DOWNLOADED: string[] = [];
const __SKIPPED: string[] = [];

const userFnpmCache = readConfig().cache;
const downloadFile = ".fnpm";

const REGISTRY = readConfig().registry;

export default async function install(opts: string[]) {
  ora(chalk.blue(`Using ${REGISTRY} as registry...`)).info();

  const addDeps = await getParamsDeps(opts);

  const flag = opts.filter((opt) => opt.startsWith("-"))[0];

  await createModules();

  // Read package.json
  const pkg = await rpjf("./package.json");

  // Read "workspaces" field
  const workspaces = pkg.workspaces || null;

  const wsDeps = await getDepsWorkspaces(workspaces);

  // Get all dependencies with version
  const deps = getDeps(pkg).concat(wsDeps).concat(addDeps);

  const __fetch = ora(chalk.green("Fetching packages...")).start();
  const __fetch_start = performance.now();

  await Promise.all(
    deps.map(async (dep) => {
      const islocal = dep.version.startsWith("file:");

      if (islocal) {
        await installLocalDep(dep);
        return;
      }

      const manifest = await pacote.manifest(`${dep.name}@${dep.version}`, {
        registry: REGISTRY,
      });

      __fetch.text = chalk.green(`Fetched ${dep.name}!`);

      pkgs.push({
        name: dep.name,
        version: manifest.version,
        spec: dep.version,
        tarball: manifest.dist.tarball,
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

  const __install = ora(chalk.green("Installing packages...")).start();
  const __install_start = performance.now();

  await Promise.all(
    pkgs.map(async (pkg) => {
      await installPkg(pkg, pkg.parent, __install);
    })
  );

  const __install_end = performance.now();
  __install.succeed(
    chalk.green(
      `Installed packages in ${chalk.gray(
        parseTime(__install_start, __install_end)
      )}`
    )
  );

  // Get all __SKIPPED packages, check if they are in __INSTALLED and install them if not
  await Promise.all(
    [...__SKIPPED].map(async (pkg) => {
      const isInstalled = __INSTALLED.find((i) => i.name === pkg);

      if (!isInstalled) {
        const manifest = await pacote.manifest(`${pkg}@latest`, {
          registry: REGISTRY,
        });

        ora(chalk.gray(`Installing ${pkg}@latest...`)).info();
        await installPkg(
          {
            name: pkg,
            version: manifest.version,
            spec: "latest",
            tarball: manifest.dist.tarball,
          },
          undefined,
          undefined
        );
      }

      return;
    })
  );

  const __binaries = ora(chalk.blue("Installing binaries...")).start();
  const __binaries_start = performance.now();
  await installBins();
  const __binaries_end = performance.now();
  __binaries.succeed(
    chalk.blue(
      `Installed binaries in ${chalk.gray(
        parseTime(__binaries_start, __binaries_end)
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

    await writeFile(
      path.join(process.cwd(), "package.json"),
      JSON.stringify(pkg, null, 2),
      "utf-8"
    );
  }

  ora(chalk.green("Done!")).succeed();
  process.exit();
}

export async function installPkg(
  manifest: any,
  parent?: string,
  spinner?: Ora
) {
  const cacheFolder = `${userFnpmCache}/${manifest.name}/${manifest.version}`;

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
        pkg.name === manifest.name && satisfies(pkg.version, manifest.spec)
    );

  if (pkgInstalled) {
    return;
  }

  // Check if spec is * and add it to __SKIPPED
  if (manifest.spec === "*") {
    __SKIPPED.push(manifest.name);
    return;
  }

  // Check if package is already in root node_modules
  const isSuitable = __INSTALLED.find((pkg) => pkg.name === manifest.name);

  // If package is already installed, but not in root node_modules then install it in root node_modules else install it in parent node_modules
  const pkgProjectDir = !isSuitable
    ? path.join(process.cwd(), "node_modules", manifest.name)
    : parent
    ? path.join(parent, "node_modules", manifest.name)
    : path.join(process.cwd(), "node_modules", manifest.name);

  if (!isSuitable) {
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
      const { tarball, pathname = path } = cachedDeps[dep][version];

      await installPkg(
        {
          name,
          version,
          tarball,
          pathname,
        },
        path.join(process.cwd(), "node_modules", manifest.name),
        spinner
      );
    }
  } else {
    if (spinner)
      spinner.text = chalk.green(
        `Installing ${manifest.name}... ${chalk.grey("(cache miss)")}`
      );
    await extract(cacheFolder, manifest.tarball);
    if (existsSync(pkgProjectDir)) {
      await rm(pkgProjectDir, { recursive: true });
    }
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

        // Disable dir creation to test if it works :)
        /* if (deps.length > 0)
          mkdir(`${cacheFolder}/node_modules`, { recursive: true }); */

        // Install production deps
        const installed = await Promise.all(
          deps.map(async (dep) => {
            const manifest = await pacote.manifest(
              `${dep.name}@${dep.version}`,
              {
                registry: REGISTRY,
              }
            );

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
      }

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

      __DOWNLOADED.push(`${manifest.name}@${manifest.version}`);
      return;
    } catch (error: any) {
      // Check if error is ENOENT
      if (error.code === "ENOENT") {
        return await extract(cacheFolder, manifest.tarball);
      }
    }
  }
}

async function extract(cacheFolder: string, tarball: string): Promise<any> {
  // Check if file ".fnpm" exists inside cacheFolder using access
  const folderContent = await readdir(cacheFolder)
    .then((files) => {
      return files;
    })
    .catch(() => {
      return [];
    });

  // @ts-ignore-next-line
  if (folderContent.length > 0 && folderContent.includes(downloadFile)) {
    return { res: "exists", error: null };
  }

  if (__DOWNLOADING.includes(tarball)) {
    return { res: "downloading", error: null };
  }

  __DOWNLOADING.push(tarball);
  const { res, error } = await pacote
    .extract(tarball, cacheFolder)
    .then(() => {
      return { res: "ok", error: null };
    })
    .catch(async (err) => {
      return { res: null, error: err };
    });

  if (res === null) {
    ora(chalk.red(`Trying to extract ${tarball} again!`)).fail();
    return await extract(cacheFolder, tarball);
  }

  await writeFile(path.join(cacheFolder, downloadFile), JSON.stringify([]));
  __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);

  return { res, error };
}

type cachedDep = {
  [key: string]: {
    [key: string]: {
      path: string;
      tarball: string;
    };
  };
};
