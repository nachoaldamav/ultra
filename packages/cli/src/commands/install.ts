import chalk from "chalk";
import ora, { Ora } from "ora";
import rpjf from "read-package-json-fast";
import { symlink, mkdir, rm, readdir, writeFile } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import os from "os";
import { existsSync } from "fs";
import { getDeps } from "../utils/getDeps.js";
import pacote from "pacote";
import { installBins } from "../utils/addBinaries.js";
import { getDepsWorkspaces } from "../utils/getDepsWorkspaces.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import { createModules } from "../utils/createModules.js";
import { hardLink } from "../utils/hardLink.js";

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

export default async function install() {
  ora(chalk.blue(`Using ${REGISTRY} as registry...`)).info();

  await createModules();

  // Read package.json
  const pkg = await rpjf("./package.json");

  // Read "workspaces" field
  const workspaces = pkg.workspaces || null;

  const wsDeps = await getDepsWorkspaces(workspaces);

  // Get all dependencies with version
  const deps = getDeps(pkg).concat(wsDeps);

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

  const folderContent = await readdir(cacheFolder)
    .then((files) => {
      return files;
    })
    .catch(() => {
      return [];
    });

  if (!folderContent.includes(downloadFile as never)) {
    // Check if parent exists
    if (parent) {
      if (!existsSync(`${parent}/node_modules`)) {
        await mkdir(`${parent}/node_modules`, { recursive: true });
      }
    }

    if (spinner) spinner.text = chalk.green(`Installing ${manifest.name}...`);

    await extract(cacheFolder, manifest.tarball);

    if (existsSync(pkgProjectDir)) {
      await rm(pkgProjectDir, { recursive: true });
      const dirs = pkgProjectDir.split("/");
      dirs.pop();
      await mkdir(dirs.join("/"), { recursive: true });
      /* await symlink(cacheFolder, pkgProjectDir, "junction").catch(() => {}); */
      await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});
    } else {
      // Create directory for package without the last folder
      const dirs = pkgProjectDir.split("/");
      dirs.pop();
      await mkdir(dirs.join("/"), { recursive: true });
      await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});
    }

    // Get production deps
    try {
      const pkg = await rpjf(`${cacheFolder}/package.json`);

      const deps = getDeps(pkg, {
        dev: true,
      });

      if (deps.length > 0)
        mkdir(`${cacheFolder}/node_modules`, { recursive: true });

      // Install production deps
      await Promise.all(
        deps.map(async (dep) => {
          const manifest = await pacote.manifest(`${dep.name}@${dep.version}`, {
            registry: REGISTRY,
          });

          await installPkg(
            {
              name: dep.name,
              version: manifest.version,
              tarball: manifest.dist.tarball,
            },
            pkgProjectDir,
            spinner
          );
        })
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

      __DOWNLOADED.push(`${manifest.name}@${manifest.version}`);
      return;
    } catch (error: any) {
      // Check if error is ENOENT
      if (error.code === "ENOENT") {
        return await extract(cacheFolder, manifest.tarball);
      }
    }
  } else {
    // Check if symlink exists and delete it
    if (existsSync(pkgProjectDir)) {
      await rm(pkgProjectDir, { recursive: true });
    }

    const dirs = pkgProjectDir.split("/");
    dirs.pop();
    await mkdir(dirs.join("/"), { recursive: true });
    await hardLink(cacheFolder, pkgProjectDir).catch((e) => {});
    return;
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

  await writeFile(path.join(cacheFolder, downloadFile), JSON.stringify({}));
  __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);

  return { res, error };
}
