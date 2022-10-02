import chalk from "chalk";
import { exec, spawn } from "child_process";
import ora from "ora";
import { performance } from "perf_hooks";
import os from "os";
import deleteBunManifests from "../utils/deleteBunManifests.js";
import { writeFile } from "node:fs/promises";
import { markdownTable } from "markdown-table";
import path from "path";
import { execa } from "execa";
import { fileURLToPath } from "url";
import readPackage from "../utils/readPackage.js";

const homeDir = os.homedir();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const tests = [
  {
    name: "NPM install (no cache / no lockfile)",
    command: "npm install --force",
    pre: "npm cache clean -f && rm -rf node_modules package-lock.json",
    spinner: ora(
      chalk.green(`Running "NPM install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "NPM install (with cache / no lockfile)",
    command: "npm install --force",
    pre: "rm -rf node_modules package-lock.json",
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "NPM install (with cache / with lockfile)",
    command: "npm install --force",
    pre: "rm -rf node_modules/",
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  /*   {
    name: "NPM add",
    command: "npm install @swc/core -D --force",
    pre: "ls",
    post: "npm uninstall @swc/core -D --force",
    spinner: ora(chalk.green(`Running "NPM add" ...`)).stop(),
    group: 4,
  }, */
  {
    name: "YARN install (no cache / no lockfile)",
    command: "yarn install --force",
    pre: "yarn cache clean && rm -rf node_modules yarn.lock",
    spinner: ora(
      chalk.green(`Running "YARN install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "YARN install (with cache / no lockfile)",
    command: "yarn install --force",
    pre: "rm -rf node_modules yarn.lock",
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "YARN install (with cache / with lockfile)",
    command: "yarn install --force",
    pre: "rm -rf node_modules",
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  /*   {
    name: "YARN add",
    command: "yarn add @swc/core -D --force",
    pre: "ls",
    post: "yarn remove @swc/core -D --force",
    spinner: ora(chalk.green(`Running "YARN add" ...`)).stop(),
    group: 4,
  }, */
  {
    name: "FNPM install (no cache / no lockfile)",
    command: "fnpm install",
    pre: "npm cache clean -f && fnpm clear",
    spinner: ora(
      chalk.green(`Running "FNPM install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "FNPM install (with cache / no lockfile)",
    command: "fnpm install",
    pre: "rm -rf node_modules fnpm.lock",
    spinner: ora(
      chalk.green(`Running "FNPM install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "FNPM install (with cache / with lockfile)",
    command: "fnpm install",
    pre: "rm -rf node_modules",
    spinner: ora(
      chalk.green(`Running "FNPM install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  /*   {
    name: "FNPM add",
    command: "fnpm install @swc/core -D",
    pre: "ls",
    post: "fnpm remove @swc/core",
    spinner: ora(chalk.green(`Running "FNPM add" ...`)).stop(),
    group: 4,
  }, */
  {
    name: "PNPM install (no cache / no lockfile)",
    command: "pnpm install --force",
    pre: `npm cache clean -f && pnpm store prune && rm -rf node_modules pnpm-lock.yaml ${homeDir}.local/share/pnpm/store/v3`,
    spinner: ora(chalk.green(`Running "PNPM install (no cache)"...`)).stop(),
    group: 1,
  },
  {
    name: "PNPM install (with cache / no lockfile)",
    command: "pnpm install --force",
    pre: `rm -rf node_modules pnpm-lock.yaml`,
    spinner: ora(
      chalk.green(`Running "PNPM install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "PNPM install (with cache / with lockfile)",
    command: "pnpm install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "PNPM install (with cache)"...`)).stop(),
    group: 3,
  },
  /*   {
    name: "PNPM add",
    command: "pnpm add @swc/core -D",
    pre: "ls",
    post: "pnpm remove @swc/core",
    spinner: ora(chalk.green(`Running "PNPM add" ...`)).stop(),
    group: 4,
  }, */
  {
    name: "Bun install (no cache / no lockfile)",
    command: "bun install",
    pre: `npm cache clean -f && rm -rf ${homeDir}.bun bun.lockb node_modules package-lock.json yarn.lock`,
    spinner: ora(
      chalk.green(`Running "Bun install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "Bun install (with cache / no lockfile)",
    command: "bun install",
    pre: "rm -rf node_modules bun.lockb package-lock.json yarn.lock",
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "Bun install (with cache / with lockfile)",
    command: "bun install",
    pre: "rm -rf node_modules",
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  /*   {
    name: "Bun add",
    command: "bun add @swc/core -d",
    pre: "ls",
    post: "bun remove @swc/core",
    spinner: ora(chalk.green(`Running "Bun add" ...`)).stop(),
    group: 4,
  }, */
];

export async function benchmark(args: string[]) {
  const pkg = readPackage(path.join(__dirname, "..", "..", "package.json"));
  const currentPkg = readPackage(path.join(process.cwd(), "package.json"));
  // If the user passed flag --only-fnpm, we only run the fnpm tests
  const onlyfnpm = args.includes("--only-fnpm");
  const ignoreBun = args.includes("--ignore-bun");
  const ignorePnpm = args.includes("--ignore-pnpm");

  if (onlyfnpm) ora(chalk.yellow("Only running fnpm tests")).warn();

  const selectedGroup = args
    .find((arg) => arg.startsWith("--group="))
    ?.replace("--group=", "");

  const testsToRun = !selectedGroup
    ? onlyfnpm
      ? tests.filter((test) => test.name.includes("FNPM"))
      : tests
    : tests.filter((test) => test.group === parseInt(selectedGroup));

  // If the user passed flag --ignore-bun, we remove the Bun tests
  if (ignoreBun) {
    const firstBunTestIndex = testsToRun.findIndex((test) =>
      test.name.includes("Bun")
    );
    testsToRun.splice(firstBunTestIndex, 3);
    ora(
      chalk.yellow(
        `Bun tests have been ignored. To run them, remove the --ignore-bun flag.`
      )
    ).warn();
  }

  if (ignorePnpm) {
    const firstPnpmTestIndex = testsToRun.findIndex((test) =>
      test.name.includes("PNPM")
    );
    testsToRun.splice(firstPnpmTestIndex, 3);
    ora(
      chalk.yellow(
        `Pnpm tests have been ignored. To run them, remove the --ignore-pnpm flag.`
      )
    ).warn();
  }

  const __init = ora(chalk.green("Starting benchmark...")).start();

  await execa("npm", [
    "install",
    "-g",
    "yarn@latest",
    "pnpm@latest",
    "npm@latest",
  ]).catch((err) => {});

  __init.succeed("Benchmark started");

  const results: {
    name: string;
    time: number;
    group: number;
    error: boolean;
  }[] = [];

  // Run the tests not in parallel
  for await (const test of testsToRun) {
    test.spinner.start();

    let start = 0;

    // Execute the pre command
    await new Promise((resolve, reject) => {
      exec(test.pre, (error, stdout, stderr) => {
        if (error) {
          start = performance.now();
          resolve(error);
          ora(chalk.red(`[Error] ${error}`)).fail();
        } else {
          start = performance.now();
          resolve(stdout);
        }
      });
    });

    if (
      test.name === "Bun install (no cache / no lockfile)" ||
      test.name === "Bun install (with cache / no lockfile)"
    ) {
      await deleteBunManifests();
    }

    let err;
    let end = 0;

    await new Promise((resolve) => {
      // Every second, we update the spinner text
      const interval = setInterval(() => {
        test.spinner.text = chalk.green(
          `${test.name}` +
            chalk.gray(
              ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`
            )
        );
      }, 1000);

      const child = spawn(test.command, {
        shell: true,
        stdio: "pipe",
      });

      child.on("exit", (code) => {
        if (code === 0) {
          end = performance.now();
          resolve(true);
          clearInterval(interval);
        } else {
          end = performance.now();
          resolve(true);
          clearInterval(interval);
          err = true;
        }
      });
    });

    results.push({
      name: test.name,
      time: end - start,
      group: test.group,
      error: err ? true : false,
    });

    test.spinner.text = chalk.green(
      `${test.name}` +
        chalk.gray(
          ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`
        )
    );
    test.spinner.succeed();

    await sleep(2000);
  }

  // Sort the results by time
  results.sort((a, b) => a.time - b.time);

  const fmt = results.map((result) => {
    return {
      name: result.name,
      // Convert to seconds or minutes if its more than 60 seconds show ❌ if there was an error
      time: result.error
        ? "❌"
        : result.time > 60000
        ? `${(result.time / 60000).toFixed(2)}m`
        : `${(result.time / 1000).toFixed(2)}s`,
      group: result.group,
    };
  });

  // Print version info
  console.log(
    chalk.green(`
  Node.js: ${process.version}
  OS: ${process.platform}
  FNPM version: ${pkg.version}
  Current project: ${currentPkg.name} (${currentPkg.version || "no version"})
  \n`)
  );

  // Print the results
  console.table(fmt);

  // Write the results to a markdown file
  const md = markdownTable(
    [
      ["Name", "Time", "Group"],
      // @ts-ignore-next-line
      ...fmt.map((result) => [result.name, result.time, result.group]),
    ],
    {
      align: ["c", "c", "c"],
    }
  );

  await writeFile(path.join(process.cwd(), "results.md"), md);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
