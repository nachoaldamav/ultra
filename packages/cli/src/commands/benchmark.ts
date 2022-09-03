import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";
import { performance } from "perf_hooks";

const tests = [
  {
    name: "NPM install (no cache / no lockfile)",
    command: "npm install --force",
    pre: "npm cache clean -f && rm -rf node_modules package-lock.json",
    // @ts-ignore-next-line
    spinner: ora(
      chalk.green(`Running "NPM install (no cache / no lockfile)"...`)
    ).stop(),
  },
  {
    name: "NPM install (with cache / no lockfile)",
    command: "npm install --force",
    pre: "rm -rf node_modules package-lock.json",
    // @ts-ignore-next-line
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / no lockfile)"...`)
    ).stop(),
  },
  {
    name: "NPM install (with cache / with lockfile)",
    command: "npm install --force",
    pre: "rm -rf node_modules/",
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / with lockfile)"...`)
    ).stop(),
  },
  {
    name: "SNPM install (no cache)",
    command: "snpm install",
    pre: "npm cache clean -f && rm -rf node_modules /home/nachoaldama/.snpm-cache",
    spinner: ora(chalk.green(`Running "SNPM install (no cache)"...`)).stop(),
  },
  {
    name: "SNPM install (with cache)",
    command: "snpm install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "SNPM install (with cache)"...`)).stop(),
  },
  {
    name: "PNPM install (no cache)",
    command: "pnpm install --force",
    pre: "npm cache clean -f && pnpm store prune && rm -rf node_modules pnpm-lock.yaml",
    spinner: ora(chalk.green(`Running "PNPM install (no cache)"...`)).stop(),
  },
  {
    name: "PNPM install (with cache)",
    command: "pnpm install",
    pre: "rm -rf node_modules",
    spinner: ora(chalk.green(`Running "PNPM install"...`)).stop(),
  },
];

export async function benchmark(args: string[]) {
  // If the user passed flag --only-snpm, we only run the SNPM tests
  const onlySnpm = args.includes("--only-snpm");

  const testsToRun = onlySnpm
    ? tests.filter((test) => test.name.includes("SNPM"))
    : tests;

  const results = [];
  // Run the tests not in parallel
  for await (const test of testsToRun) {
    test.spinner.start();

    let start = 0;

    // Execute the pre command
    await new Promise((resolve, reject) => {
      exec(test.pre, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          ora(chalk.red(`[Error] ${error}`)).fail();
        } else {
          start = performance.now();
          resolve(stdout);
        }
      });
    });

    let err;
    let end = 0;

    await new Promise((resolve) => {
      exec(test.command, (error, stdout, stderr) => {
        console.log({
          error,
          stdout,
          stderr,
        });
        if (error) {
          err = error;
        }
        end = performance.now();
        resolve(true);
      });
    });

    results.push({
      name: test.name,
      time: end - start,
      error: err,
    });
    test.spinner.succeed(chalk.green(`Finished "${test.name}"!`));
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
    };
  });

  // Print the results in a table
  console.table(fmt);
}
