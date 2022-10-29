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

const delCommand = os.platform() === "win32" ? "del /s /q" : "rm -rf";

const homeDir = os.homedir();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const tests = [
  {
    name: "NPM install (no cache / no lockfile)",
    command: "npm install --force --ignore-scripts",
    pre: `npm cache clean -f && ${delCommand} node_modules package-lock.json`,
    spinner: ora(
      chalk.green(`Running "NPM install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "NPM install (with cache / no lockfile)",
    command: "npm install --force --ignore-scripts",
    pre: `${delCommand} node_modules package-lock.json`,
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "NPM install (with cache / with lockfile)",
    command: "npm install --force --ignore-scripts",
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  {
    name: "YARN install (no cache / no lockfile)",
    command: "yarn install --force --ignore-scripts",
    pre: `yarn cache clean && ${delCommand} node_modules yarn.lock`,
    spinner: ora(
      chalk.green(`Running "YARN install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "YARN install (with cache / no lockfile)",
    command: "yarn install --force --ignore-scripts",
    pre: `${delCommand} node_modules yarn.lock`,
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "YARN install (with cache / with lockfile)",
    command: "yarn install --force --ignore-scripts",
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },

  {
    name: "⚡ ULTRA install (no cache / no lockfile)",
    command: "ultra install --ignore-scripts",
    pre: "ultra clear",
    spinner: ora(
      chalk.green(`Running "ULTRA install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "⚡ ULTRA install (with cache / no lockfile)",
    command: "ultra install --ignore-scripts",
    pre: `${delCommand} node_modules ultra.lock`,
    spinner: ora(
      chalk.green(`Running "ULTRA install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "⚡ ULTRA install (with cache / with lockfile)",
    command: "ultra install --ignore-scripts",
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "ULTRA install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
  /*{
    name: "ULTRA Beta install (no cache / no lockfile)",
    command: "ultra ib",
    pre: "npm cache clean -f && ultra clear",
    spinner: ora(
      chalk.green(`Running "ULTRA Beta install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "ULTRA Beta install (with cache / no lockfile)",
    command: "ultra ib",
    pre: "rm -rf node_modules ultra.lock",
    spinner: ora(
      chalk.green(`Running "ULTRA Beta install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "ULTRA Beta install (with cache / with lockfile)",
    command: "ultra ib",
    pre: "rm -rf node_modules",
    spinner: ora(
      chalk.green(`Running "ULTRA Beta install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  }, */
  {
    name: "PNPM install (no cache / no lockfile)",
    command:
      "pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store",
    pre: `npm cache clean -f && pnpm store prune && ${delCommand} node_modules pnpm-lock.yaml ${homeDir}.local/share/pnpm/store/v3 cache/`,
    spinner: ora(
      chalk.green(`Running "PNPM install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "PNPM install (with cache / no lockfile)",
    command:
      "pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store",
    pre: `${delCommand} node_modules pnpm-lock.yaml`,
    spinner: ora(
      chalk.green(`Running "PNPM install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "PNPM install (with cache / with lockfile)",
    command:
      "pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store",
    pre: `${delCommand} node_modules`,
    spinner: ora(chalk.green(`Running "PNPM install (with cache)"...`)).stop(),
    group: 3,
  },

  {
    name: "Bun install (no cache / no lockfile)",
    command: "bun install",
    pre: `npm cache clean -f && ${delCommand} ${homeDir}.bun bun.lockb node_modules package-lock.json yarn.lock`,
    spinner: ora(
      chalk.green(`Running "Bun install (no cache / no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "Bun install (with cache / no lockfile)",
    command: "bun install",
    pre: `${delCommand} node_modules bun.lockb package-lock.json yarn.lock`,
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / no lockfile)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "Bun install (with cache / with lockfile)",
    command: "bun install",
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / with lockfile)"...`)
    ).stop(),
    group: 3,
  },
];

export async function benchmark(args: string[]) {
  const pkg = readPackage(path.join(__dirname, "..", "..", "package.json"));
  const currentPkg = readPackage(path.join(process.cwd(), "package.json"));
  // If the user passed flag --only-ultra, we only run the ultra tests
  const onlyultra = args.includes("--only-ultra");
  const ignoreBun = args.includes("--ignore-bun");
  const ignorePnpm = args.includes("--ignore-pnpm");
  const genjson = args.includes("--json");

  if (onlyultra) ora(chalk.yellow("Only running ultra tests")).warn();

  const selectedGroup = args
    .find((arg) => arg.startsWith("--group="))
    ?.replace("--group=", "");

  const testsToRun = !selectedGroup
    ? onlyultra
      ? tests.filter((test) => test.name.includes("ULTRA"))
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
    memory: number;
  }[] = [];

  // Run the tests not in parallel
  for await (const test of testsToRun) {
    test.spinner.start();

    let start = 0;

    // Execute the pre command
    await new Promise(async (resolve, reject) => {
      exec(test.pre, (error, stdout, stderr) => {
        if (error) {
          resolve(error);
          ora(chalk.red(`[Error] ${error}`)).fail();
        } else {
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

    start = performance.now();

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

      // Execute the command
      exec(test.command, (error, stdout, stderr) => {
        clearInterval(interval);
        if (error) {
          err = true;
          ora(chalk.red(`[Error] ${error}`)).fail();
          end = performance.now();
        } else {
          end = performance.now();
        }
        resolve(stdout);
      });
    });

    results.push({
      name: test.name,
      time: end - start,
      group: test.group,
      error: err ? true : false,
      memory: process.memoryUsage().heapUsed,
    });

    test.spinner.text = chalk.green(
      `${test.name}` +
        chalk.gray(
          ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`
        )
    );
    test.spinner.succeed();

    await sleep(5000);
    continue;
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
      memory: `${(result.memory / 1000000).toFixed(2)}MB`,
      group: result.group,
    };
  });

  // Print version info
  console.log(
    chalk.green(`
  Node.js: ${process.version}
  OS: ${process.platform}
  ULTRA version: ${pkg.version}
  Current project: ${currentPkg.name} (${currentPkg.version || "no version"})`)
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

  if (genjson) {
    await writeFile(
      path.join(process.cwd(), "results.json"),
      JSON.stringify(
        results.map((result) => {
          return {
            name: result.name,
            value: result.time,
            group: result.group,
          };
        }),
        null,
        2
      )
    );
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
