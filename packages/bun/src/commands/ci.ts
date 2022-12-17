import binLinks from "bin-links";
import chalk from "chalk";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import ora, { Ora } from "ora";
import basePostInstall from "../utils/basePostInstall.js";
import { installLocalDep } from "../utils/installLocalDep.js";
import manifestFetcher from "../utils/manifestFetcher.js";
import parseTime from "../utils/parseTime.js";
import { ultraExtract } from "../utils/extract.js";
import readPackage from "../utils/readPackage.js";
import { executePost } from "../utils/postInstall.js";

export async function continuousInstall() {
  try {
    const lockFile: string | null = readFileSync(
      join(process.cwd(), "ultra.lock"),
      "utf-8"
    );

    const lock = lockFile ? JSON.parse(lockFile) : null;

    if (!lock) {
      console.log(chalk.red("No lock file found!"));
      process.exit(1);
    }

    // Remove node_modules folder
    await rm(join(process.cwd(), "node_modules"), {
      recursive: true,
      force: true,
    });

    const __install = ora({
      text: chalk.green("Installing dependencies..."),
      discardStdin: false,
    }).start();
    const start = performance.now();

    // Hardlink all the packages in ultra.lock to each path from cache
    await Promise.all(
      Object.keys(lock).map(async (pkg) => {
        // Install depenedencies in parallel using forks
        await Promise.all(
          Object.keys(lock[pkg]).map(async (version) => {
            const pathname = join(process.cwd(), lock[pkg][version].path);

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

            const spec = `${pkg}@${version}`;

            __install.text = chalk.green(`${spec}`);
            return await ciDownloader(spec, pathname, __install);
          })
        );
      })
    );

    const end = performance.now();
    __install.prefixText = "";
    __install.succeed(
      chalk.green(`Installed dependencies in ${parseTime(start, end)}`)
    );
    await basePostInstall();

    process.exit(0);
  } catch (err) {
    console.log(chalk.red("Error reading lock file!"));
    process.exit(1);
  }
}

async function ciDownloader(spec: string, pathname: string, spinner: Ora) {
  spinner.text = chalk.green(`${spec}`);
  spinner.prefixText = "🔍";
  const manifest = await manifestFetcher(spec);

  const tarball = manifest.dist.tarball;
  const integrity = manifest.dist.integrity;

  if (!existsSync(pathname)) {
    mkdirSync(pathname, { recursive: true });
  }

  spinner.text = chalk.green(`${spec}`);
  spinner.prefixText = "📦";
  await ultraExtract(pathname, tarball, integrity, manifest.name);

  spinner.prefixText = "🔗";
  const pkg = readPackage(join(pathname, "package.json"));

  await binLinks({
    path: pathname,
    pkg: pkg,
    global: false,
    force: true,
  });

  spinner.text = chalk.green(`${spec}`);
  spinner.prefixText = "📄";
  const postinstall = pkg?.scripts?.postinstall || null;
  if (postinstall) {
    await executePost(postinstall, pathname);
  }

  return;
}
