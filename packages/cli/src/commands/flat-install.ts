import chalk from "chalk";
import ora from "ora";
import rpjf from "read-package-json-fast";
import { symlink, chmod, mkdir, rm } from "fs/promises";
import glob from "glob";
import path from "path";
import os from "os";
import { existsSync } from "fs";
import { getDeps } from "../utils/getDeps.js";
import pacote from "pacote";

let pkgs: {
  name: string;
  version: string;
  tarball: string;
}[] = [];

const __DOWNLOADING: string[] = [];

const userSnpmCache = `${os.homedir()}/.snpm-cache`;

export default async function flatInstall() {
  // Read package.json
  const pkg = await rpjf("./package.json");

  // Get all dependencies with version
  const deps = getDeps(pkg);

  const __fetch = ora(chalk.green("Fetching packages...")).start();

  await Promise.all(
    deps.map(async (dep) => {
      const manifest = await pacote.manifest(`${dep.name}@${dep.version}`, {
        registry: "https://snpm-edge.snpm.workers.dev/package/",
      });

      __fetch.text = chalk.green(`Fetched ${dep.name}!`);

      pkgs.push({
        name: dep.name,
        version: manifest.version,
        tarball: manifest.dist.tarball,
      });
    })
  );

  __fetch.succeed(chalk.green("Fetched all packages!"));

  const __install = ora(chalk.green("Installing packages...")).start();

  await Promise.all(
    pkgs.map(async (pkg) => {
      await installPkg(pkg);
      __install.text = chalk.green(`Installed ${pkg.name}!`);
    })
  );

  __install.succeed(chalk.green("Installed all packages!"));
}

async function installPkg(manifest: any, parent?: string) {
  const cacheFolder = `${userSnpmCache}/${manifest.name}/${manifest.version}`;

  // Check if parent exists
  if (parent) {
    if (!existsSync(`${parent}/node_modules`)) {
      await mkdir(`${parent}/node_modules`, { recursive: true });
    }
  }

  await extract(cacheFolder, manifest.tarball);

  const pkgProjectDir = !parent
    ? path.join(process.cwd(), "node_modules", manifest.name)
    : path.join(parent, "node_modules", manifest.name);

  if (existsSync(pkgProjectDir)) {
    await rm(pkgProjectDir, { recursive: true });
    await symlink(cacheFolder, pkgProjectDir, "dir");
  } else {
    // Create directory for package without the last folder
    await mkdir(pkgProjectDir, { recursive: true });
    await symlink(cacheFolder, pkgProjectDir, "dir").catch(() => {});
  }

  // Get production deps
  try {
    const pkg = await rpjf(`${cacheFolder}/package.json`);
    const deps = Object.keys(pkg.dependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.dependencies[dep],
      };
    });

    if (deps.length > 0)
      mkdir(`${cacheFolder}/node_modules`, { recursive: true });

    // Install production deps
    await Promise.all(
      deps.map(async (dep) => {
        const manifest = await pacote.manifest(`${dep.name}@${dep.version}`, {
          registry: "https://snpm-edge.snpm.workers.dev/package/",
        });

        await installPkg(
          {
            name: dep.name,
            version: manifest.version,
            tarball: manifest.dist.tarball,
          },
          pkgProjectDir
        );
      })
    );
  } catch (error) {}
}

async function extract(cacheFolder: string, tarball: string): Promise<boolean> {
  if (!existsSync(cacheFolder)) {
    __DOWNLOADING.push(tarball);
    const res = await pacote
      .extract(tarball, cacheFolder, {
        cache: userSnpmCache,
      })
      .then(() => {
        return true;
      })
      .catch(async (err) => {
        return false;
      });

    if (!res) {
      ora(chalk.red(`Trying to extract ${tarball} again!`)).fail();
      return await extract(cacheFolder, tarball);
    }

    __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);
    return res;
  } else if (__DOWNLOADING.includes(tarball)) {
    ora(chalk.blue(`Already downloading ${tarball}!`)).info();
    return await extract(cacheFolder, tarball);
  }

  return true;
}
