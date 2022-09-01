import path from "path";
import os from "os";
import chalk from "chalk";
import ora from "ora";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import Arborist from "@npmcli/arborist";
import { fork } from "child_process";
import { fileURLToPath } from "url";
import { _downloadSpinner } from "../utils/downloadSpinner.js";
import { installBins } from "../utils/addBinaries.js";

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
