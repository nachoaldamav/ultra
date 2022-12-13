import chalk from "chalk";
import ora from "ora";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "path";
import { performance } from "perf_hooks";
import binLinks from "bin-links";
import { installLocalDep } from "../utils/installLocalDep.js";
import parseTime from "../utils/parseTime.js";
import readPackage from "../utils/readPackage.js";
import basePostInstall from "../utils/basePostInstall.js";
import { __dirname } from "../utils/__dirname.js";
import checkLock from "../utils/checkLock.js";
import { executePost } from "../utils/postInstall.js";
import { ultraExtract } from "./extract.js";
import { updateIndex } from "./updateIndex.js";
import { checkDist } from "./checkDist.js";
import { gitInstall } from "./gitInstaller.js";
import { linker } from "./linker.js";

export async function installLock(lock: any) {
  const start = performance.now();
  const __install = ora(chalk.green("Installing dependencies...")).start();

  let deps = 0;

  __install.prefixText = "🔗";

  checkLock(lock);

  // Hardlink all the packages in ultra.lock to each path from cache
  await Promise.all(
    Object.keys(lock).map(async (pkg) => {
      await Promise.all(
        Object.keys(lock[pkg]).map(async (version) => {
          const pathname = path.join(process.cwd(), lock[pkg][version].path);
          const { tarball, integrity, optional } = lock[pkg][version];

          if (optional) {
            const isSuitablePlatform = checkDist(pkg);

            if (!isSuitablePlatform) {
              return;
            }
          }

          deps++;

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

          const cache = path.join(userUltraCache, lock[pkg][version].cache);

          let manifest;

          if (existsSync(path.join(pathname, "package.json"))) {
            manifest = readPackage(path.join(pathname, "package.json"));

            if (manifest.version !== version) {
              await rm(pathname, { recursive: true, force: true }).catch(
                () => {}
              );
            } else {
              return;
            }
          }

          if (existsSync(cache)) {
            await linker(cache, pathname);
            __install.text = chalk.green(`${pkg}`);
            __install.prefixText = "🔗";
          } else {
            __install.text = chalk.green(`${pkg}`);
            __install.prefixText = "📦";
            if (version.startsWith("git")) {
              await gitInstall({
                name: pkg,
                version,
              });
            } else {
              await ultraExtract(cache, tarball, integrity, pkg);
            }
            updateIndex(pkg, version);
            __install.prefixText = "🔗";
            await linker(cache, pathname);
          }

          manifest = readPackage(path.join(cache, "package.json"));

          // If the package has a postinstall script, run it
          if (manifest.scripts?.postinstall && !__NOPOSTSCRIPTS) {
            await executePost(manifest.scripts.postinstall, pathname);
          }

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

  __install.prefixText = "";
  const end = performance.now();
  __install.text = chalk.green(
    `Installed ${chalk.grey.bold(deps)} dependencies in ${chalk.grey(
      parseTime(start, end)
    )} ${chalk.grey("(from lockfile)")}`
  );

  __install.stopAndPersist({
    symbol: chalk.green("⚡"),
  });

  await basePostInstall();
  return;
}
