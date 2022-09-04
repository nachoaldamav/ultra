import os from "os";
import path from "path";
import pacote from "pacote";
import ora, { Ora } from "ora";
import rpjf from "read-package-json-fast";
import chalk from "chalk";
import { mkdir, readdir, rm, symlink, writeFile } from "fs/promises";
import { createModules } from "../utils/createModules.js";
import { existsSync } from "fs";
import { getDeps } from "../utils/getDeps.js";
import { promisify } from "util";
import { exec as execCallback } from "child_process";
const exec = promisify(execCallback);

const userSnpmCache = path.join(os.homedir(), ".snpm-cache");
const REGISTRY = "https://registry.npmjs.org/";

const __DOWNLOADING: string[] = [];

export default async function add(deps: string[]) {
  await createModules();
  const pkgs = await Promise.all(
    deps.map(async (dep) => {
      const manifest = await pacote.manifest(dep, {
        registry: "https://registry.npmjs.org/",
      });

      if (!manifest) {
        ora(chalk.red(`Package ${dep} not found!`)).fail();
      }

      return {
        name: manifest.name,
        version: manifest.version,
        tarball: manifest.dist.tarball,
      };
    })
  );

  const __install = ora(chalk.green("Installing packages...")).start();

  await Promise.all(
    pkgs.map(async (pkg) => {
      await install(pkg, __install);
    })
  );

  __install.succeed(chalk.green("Installed all packages!"));

  // Add packages to package.json
  const pkg = await rpjf(path.join(process.cwd(), "package.json"));

  pkg.dependencies = pkg.dependencies || {};

  pkgs.forEach((dep) => {
    pkg.dependencies[dep.name] = dep.version;
  });

  await writeFile(
    path.join(process.cwd(), "package.json"),
    JSON.stringify(pkg, null, 2)
  );

  ora(chalk.green("Added all packages!")).succeed();
}

async function install(pkg: Install["pkg"], spinner: Ora, parent?: string) {
  const cacheFolder = `${userSnpmCache}/${pkg.name}/${pkg.version}`;

  const pkgProjectDir = !parent
    ? path.join(process.cwd(), "node_modules", pkg.name)
    : path.join(parent, "node_modules", pkg.name);

  const folderContent = await readdir(cacheFolder)
    .then((files) => {
      return files;
    })
    .catch(() => {
      return [];
    });

  const downloadFile = "snpm-download.json";

  if (!folderContent.includes(downloadFile as never)) {
    // Check if parent exists
    if (parent) {
      if (!existsSync(`${parent}/node_modules`)) {
        await mkdir(`${parent}/node_modules`, { recursive: true });
      }
    }

    if (spinner) spinner.text = chalk.green(`Installing ${pkg.name}...`);

    await extract(cacheFolder, pkg.tarball);

    if (existsSync(pkgProjectDir)) {
      await rm(pkgProjectDir, { recursive: true });
      const dirs = pkgProjectDir.split("/");
      dirs.pop();
      await mkdir(dirs.join("/"), { recursive: true });
      await symlink(cacheFolder, pkgProjectDir, "junction").catch(() => {});
    } else {
      // Create directory for package without the last folder
      const dirs = pkgProjectDir.split("/");
      dirs.pop();
      await mkdir(dirs.join("/"), { recursive: true });
      await symlink(cacheFolder, pkgProjectDir, "junction").catch((e) => {
        ora(
          chalk.red(`Error installing ${pkg.name}! ${JSON.stringify(e)}`)
        ).fail();
      });
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

          await install(
            {
              name: dep.name,
              version: manifest.version,
              tarball: manifest.dist.tarball,
            },
            spinner,
            pkgProjectDir
          );
        })
      );

      // Execute postinstall script if exists
      const postinstall = pkg.scripts.postinstall;

      if (postinstall) {
        const postinstallPath = path.join(cacheFolder, "node_modules", ".");
        const postinstallScript = path.join(postinstallPath, postinstall);

        if (existsSync(postinstallScript)) {
          await exec(`${postinstallScript}`, {
            cwd: postinstallPath,
          });
        }
      }

      return;
    } catch (error: any) {
      // Check if error is ENOENT
      if (error.code === "ENOENT") {
        await extract(cacheFolder, pkg.tarball);
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
    await symlink(cacheFolder, pkgProjectDir, "dir").catch(() => {});
    return;
  }
}

async function extract(cacheFolder: string, tarball: string): Promise<any> {
  // Check if file ".snpm-download" exists inside cacheFolder using access
  const folderContent = await readdir(cacheFolder)
    .then((files) => {
      return files;
    })
    .catch(() => {
      return [];
    });

  const downloadFile = "snpm-download.json";

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

type Install = {
  pkg: {
    name: string;
    version: string;
    tarball: string;
  };
  spinner: Ora;
  parent?: string;
};
