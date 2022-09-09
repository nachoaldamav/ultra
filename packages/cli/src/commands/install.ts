import chalk from "chalk";
import ora, { Ora } from "ora";
import rpjf from "read-package-json-fast";
import { mkdir, rm, readdir, writeFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import os from "os";
import { existsSync, readFileSync } from "fs";
import { getDeps } from "../utils/getDeps.js";
import pacote from "pacote";
import { installBins } from "../utils/addBinaries.js";
import { getDepsWorkspaces } from "../utils/getDepsWorkspaces.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import { createModules } from "../utils/createModules.js";
import { hardLink } from "../utils/hardLink.js";
import getParamsDeps from "../utils/parseDepsParams.js";
import readWasm from "../utils/readWasm.js";

let pkgs: {
  name: string;
  version: string;
  tarball: string;
  parent?: string;
}[] = [];

const __DOWNLOADING: string[] = [];
const __DOWNLOADED: string[] = [];
const __INSTALLED: {
  name: string;
  version: string;
}[] = [];

const userSnpmCache = `${os.homedir()}/.snpm-cache`;
const downloadFile = ".snpm";

const REGISTRY = "https://registry.npmjs.org/";

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
        tarball: manifest.dist.tarball,
        parent: dep.parent || undefined,
      });
    })
  );

  __fetch.succeed(chalk.green("Fetched all packages!"));

  const __install = ora(chalk.green("Installing packages...")).start();

  await Promise.all(
    pkgs.map(async (pkg) => {
      await installPkg(pkg, pkg.parent, __install);
    })
  );

  __install.succeed(chalk.green("Installed all packages!"));

  const __binaries = ora(chalk.blue("Installing binaries...")).start();
  await installBins();

  __binaries.succeed(chalk.blue("Installed binaries!"));

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
  const cacheFolder = `${userSnpmCache}/${manifest.name}/${manifest.version}`;

  // Check if package is already installed
  if (
    __INSTALLED.find(
      (pkg) => pkg.name === manifest.name && pkg.version === manifest.version
    )
  ) {
    return;
  }

  // Check if package is already in root node_modules
  const isSuitable = __INSTALLED.find((pkg) => pkg.name === manifest.name);

  // If package is already installed, but not in root node_modules then install it in root node_modules else install it in parent node_modules
  const pkgProjectDir = !isSuitable
    ? path.join(process.cwd(), "node_modules", manifest.name)
    : path.join(
        process.cwd(),
        "node_modules",
        parent
          ? path.join(parent, "node_modules", manifest.name)
          : manifest.name
      );

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

  // Check if package is already in cache, searching for file .snpm
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
    /* const cachedDeps = JSON.parse(
      readFileSync(`${cacheFolder}/${downloadFile}`, "utf-8")
    ); */
    const cachedDeps = readWasm(`${cacheFolder}/${downloadFile}`);

    return await Promise.all(
      cachedDeps.map(async (dep: any) => {
        await installPkg(dep, manifest.name, spinner);
      })
    );
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

        if (deps.length > 0)
          mkdir(`${cacheFolder}/node_modules`, { recursive: true });

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
              },
              pkgProjectDir,
              spinner
            );
            return {
              name: dep.name,
              version: manifest.version,
              tarball: manifest.dist.tarball,
              path: path.join(userSnpmCache, dep.name, manifest.version),
            };
          })
        );

        // Save installed deps with its path in .snpm file
        await writeFile(
          `${cacheFolder}/${downloadFile}`,
          JSON.stringify(
            installed.map((dep) => ({
              name: dep.name,
              version: dep.version,
              tarball: dep.tarball,
              path: dep.path,
            })),
            null,
            2
          ),
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
  // Check if file ".snpm" exists inside cacheFolder using access
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

async function installCachedDeps(
  pathName: string,
  spinner?: Ora
): Promise<any> {
  // Read .snpm file from path
  const cachedDeps = JSON.parse(
    readFileSync(path.join(pathName, downloadFile), "utf-8")
  );

  return await Promise.all(
    cachedDeps.map(async (dep: any) => {
      // Get version of dep by slicing the path and getting the last folder
      const version = dep.path.split("/").pop();

      return await installPkg(
        {
          name: dep.name,
          version,
          tarball: `${REGISTRY}/${dep.name}/-/${dep.name}-${version}.tgz`,
        },
        undefined,
        spinner
      );
    })
  );
}
