import path from "path";
import os from "os";
import glob from "glob";
import chalk from "chalk";
import ora from "ora";
import { chmod, mkdir, symlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import Arborist from "@npmcli/arborist";
import { fork } from "child_process";
import { fileURLToPath } from "url";
import { _downloadSpinner } from "../utils/downloadSpinner.js";
import rpjf from "read-package-json-fast";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const options = {
  registry: "https://snpm-edge.snpm.workers.dev/package/",
};

const arb = new Arborist(options);

export let depsArray: {
  name: string;
  tarball: string;
  version: string;
  parent?: string;
  parentVersion?: string;
  isPackage?: boolean;
}[] = [];

const userSnpmCache = `${os.homedir()}/.snpm-cache`;

export async function install(packages: string[]) {
  // Get current time to calculate time taken to install packages
  const start = new Date().getTime();

  // Check if cache directory exists
  if (!existsSync(userSnpmCache)) {
    await mkdir(userSnpmCache, { recursive: true });
  }

  ora(chalk.blue(`Caching packages to ${userSnpmCache}...`)).info();
  const spinner = ora("Generating tree...").start();

  await arb.buildIdealTree({
    add: packages,
  });

  const childrens = Array.from(arb.idealTree.children);

  const pkgs = childrens.map((data) => {
    const [name, children] = data as [string, any];
    return {
      name: name,
      version: children.version,
      location: children.location,
      path: children.path,
      resolved: children.resolved,
      children: Array.from(children.edgesOut),
      parents: Array.from(children.edgesIn),
    };
  });

  await writeFile(
    path.join(process.cwd(), "tree.json"),
    JSON.stringify(pkgs, null, 2)
  );

  spinner.succeed();

  const t = _downloadSpinner;
  t.text = chalk.blue("Downloading packages...");
  t.start();

  const promises = pkgs.map(async (pkg) => {
    const fProccess = fork(path.join(__dirname, "../utils/downloadProcess.js"));
    fProccess.send(pkg);

    return new Promise((resolve) => {
      fProccess.on("close", (code) => {
        resolve(code);
      });
    });
  });

  await Promise.all(promises);

  // Check .bin directory exists
  const binDir = path.join(process.cwd(), "node_modules", ".bin");
  if (!existsSync(binDir)) {
    await mkdir(binDir, { recursive: true });
  }

  await installBins();

  t.succeed();
  const end = new Date().getTime();
  const diff = end - start;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  ora(
    chalk.green(
      `Installed ${pkgs.length} packages in ${minutes} minutes and ${seconds} seconds! 🚀`
    )
  ).succeed();

  process.exit();
}

async function installBins() {
  try {
    // Get all packages.json inside {cwd}/node_modules
    const packages = glob.sync(`${process.cwd()}/node_modules/**/package.json`);
    const promises = packages.map(async (data) => {
      const packageJSON = await rpjf(data);
      const { bin } = packageJSON;

      const packagePath = data.slice(0, data.indexOf("/package.json"));

      if (bin) {
        const isObject = typeof bin === "object";
        const isString = typeof bin === "string";

        if (isObject) {
          const keys = Object.keys(bin);
          for (const key of keys) {
            const binPath = path.join(
              process.cwd(),
              "node_modules",
              ".bin",
              key
            );

            // Create symlink to bin file
            await symlink(path.join(packagePath, bin[key]), binPath).catch(
              (err) => {
                ora(
                  chalk.red(
                    `Error installing bin from ${path.join(
                      packagePath,
                      bin[key]
                    )} to ${binPath}: ${err}`
                  )
                ).fail();
              }
            );

            await chmod(binPath, 0o755);

            break;
          }
          return;
        } else if (isString) {
          const binPath = path.join(process.cwd(), "node_modules", ".bin", bin);

          // Create symlink to bin file
          await symlink(path.join(packagePath, bin), binPath);

          await chmod(path.join(binPath), 0o755);
          return;
        }
      }
    });

    return await Promise.all(promises);
  } catch (error) {
    return;
  }
}
