import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";
import { performance } from "perf_hooks";
import os from "os";
import deleteBunManifests from "../utils/deleteBunManifests.js";
import { writeFile } from "fs/promises";
import { markdownTable } from "markdown-table";
import path from "path";
import { execa } from "execa";

const homeDir = os.homedir();

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
  {
    name: "YARN install (no cache, no lockfile)",
    command: "yarn install --force",
    pre: "yarn cache clean && rm -rf node_modules yarn.lock",
    spinner: ora(
      chalk.green(`Running "YARN install (no cache, no lockfile)"...`)
    ).stop(),
    group: 1,
  },
  {
    name: "YARN install (with cache, no lock)",
    command: "yarn install --force",
    pre: "rm -rf node_modules yarn.lock",
    spinner: ora(
      chalk.green(`Running "YARN install (with cache, no lock)"...`)
    ).stop(),
    group: 2,
  },
  {
    name: "YARN install (with cache)",
    command: "yarn install --force",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "YARN install (with cache)"...`)).stop(),
    group: 3,
  },
  {
    name: "SNPM install (no cache)",
    command: "snpm install",
    pre: "npm cache clean -f && snpm clear",
    spinner: ora(chalk.green(`Running "SNPM install (no cache)"...`)).stop(),
    group: 1,
  },
  {
    name: "SNPM install (with cache)",
    command: "snpm install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "SNPM install (with cache)"...`)).stop(),
    group: 3,
  },
  {
    name: "PNPM install (no cache)",
    command: "pnpm install --force",
    pre: `npm cache clean -f && pnpm store prune && rm -rf node_modules pnpm-lock.yaml ${homeDir}.local/share/pnpm/store/v3`,
    spinner: ora(chalk.green(`Running "PNPM install (no cache)"...`)).stop(),
    group: 1,
  },
  {
    name: "PNPM install (with cache)",
    command: "pnpm install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "PNPM install (with cache)"...`)).stop(),
    group: 3,
  },
  /*   {
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
    spinner: ora(chalk.green(`Running "Bun install (with cache)"...`)).stop(),
    group: 2,
  },
  {
    name: "Bun install (with cache / with lockfile)",
    command: "bun install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "Bun install (with cache)"...`)).stop(),
    group: 3,
  }, */
];

export async function benchmark(args: string[]) {
  const __init = ora(chalk.green("Starting benchmark...")).start();

  await execa("npm", [
    "install",
    "-g",
    "yarn@latest",
    "pnpm@latest",
    "npm@latest",
  ]);

  // Create cache folders to avoid errors
  await execa("mkdir", ["-p", `${homeDir}.local/share/pnpm/store/v3`]);

  __init.succeed("Benchmark started");

  // If the user passed flag --only-snpm, we only run the SNPM tests
  const onlySnpm = args.includes("--only-snpm");

  const selectedGroup = args
    .find((arg) => arg.startsWith("--group="))
    ?.replace("--group=", "");

  const testsToRun = !selectedGroup
    ? onlySnpm
      ? tests.filter((test) => test.name.includes("SNPM"))
      : tests
    : tests.filter((test) => test.group === parseInt(selectedGroup));

  const results: { name: string; time: number; group: number }[] = [];
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
      exec(test.command, (error, stdout, stderr) => {
        if (stderr.includes("Error: Command failed")) {
          console.log(stderr);
          err = stderr;
        }
        end = performance.now();
        clearInterval(interval);
        resolve(true);
      });
    });

    results.push({
      name: test.name,
      time: end - start,
      group: test.group,
    });

    test.spinner.text = chalk.green(
      `${test.name}` +
        chalk.gray(
          ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`
        )
    );
    test.spinner.succeed();
  }

  // Sort the results by time
  results.sort((a, b) => a.time - b.time);

  const fmt = results.map((result) => {
    return {
      name: result.name,
      // Convert to seconds or minutes if its more than 60 seconds
      time:
        result.time > 60000
          ? `${(result.time / 60000).toFixed(2)} minutes`
          : `${(result.time / 1000).toFixed(2)} seconds`,
      group: result.group,
    };
  });

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
