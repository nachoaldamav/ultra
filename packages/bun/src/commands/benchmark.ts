import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import ora from 'ora';
import { performance } from 'perf_hooks';
import os from 'os';
import deleteBunManifests from '../utils/deleteBunManifests.js';
import { writeFile } from 'node:fs/promises';
import { markdownTable } from 'markdown-table';
import path from 'path';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { rm } from 'node:fs/promises';
import readPackage from '../utils/readPackage.js';

const delCommand = os.platform() === 'win32' ? 'del /s /q' : 'rm -rf';

const homeDir = os.homedir();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const tests = [
  {
    name: 'NPM install (no cache / no lockfile)',
    command: 'npm install --force --ignore-scripts',
    pre: `npm cache clean -f && ${delCommand} node_modules package-lock.json`,
    spinner: ora(
      chalk.green(`Running "NPM install (no cache / no lockfile)"...`),
    ).stop(),
    group: 1,
  },
  {
    name: 'NPM install (with cache / no lockfile)',
    command: 'npm install --force --ignore-scripts',
    pre: `${delCommand} node_modules package-lock.json`,
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / no lockfile)"...`),
    ).stop(),
    group: 2,
  },
  {
    name: 'NPM install (with cache / with lockfile)',
    command: 'npm install --force --ignore-scripts',
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "NPM install (with cache / with lockfile)"...`),
    ).stop(),
    group: 3,
  },
  {
    name: 'NPM install (with node_modules)',
    command: 'npm install --force --ignore-scripts',
    spinner: ora(
      chalk.green(`Running "NPM install (with node_modules)"...`),
    ).stop(),
    group: 4,
  },
  {
    name: 'NPM install (add dep)',
    command: 'npm install axios --force --ignore-scripts',
    spinner: ora(chalk.green(`Running "NPM install (add dep)"...`)).stop(),
    group: 5,
  },
  {
    name: 'YARN install (no cache / no lockfile)',
    command: 'yarn install --force --ignore-scripts',
    pre: `yarn cache clean && ${delCommand} node_modules yarn.lock`,
    spinner: ora(
      chalk.green(`Running "YARN install (no cache / no lockfile)"...`),
    ).stop(),
    group: 1,
  },
  {
    name: 'YARN install (with cache / no lockfile)',
    command: 'yarn install --force --ignore-scripts',
    pre: `${delCommand} node_modules yarn.lock`,
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / no lockfile)"...`),
    ).stop(),
    group: 2,
  },
  {
    name: 'YARN install (with cache / with lockfile)',
    command: 'yarn install --force --ignore-scripts',
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "YARN install (with cache / with lockfile)"...`),
    ).stop(),
    group: 3,
  },
  {
    name: 'YARN install (with node_modules)',
    command: 'yarn install --force --ignore-scripts',
    spinner: ora(
      chalk.green(`Running "YARN install (with node_modules)"...`),
    ).stop(),
    group: 4,
  },
  {
    name: 'YARN install (add dep)',
    command: 'yarn add axios --force --ignore-scripts',
    spinner: ora(chalk.green(`Running "YARN install (add dep)"...`)).stop(),
    group: 5,
  },
  {
    name: '⚡ ULTRA install (no cache / no lockfile)',
    command: 'ultra install --ignore-scripts',
    pre: 'ultra clear',
    spinner: ora(
      chalk.green(`Running "ULTRA install (no cache / no lockfile)"...`),
    ).stop(),
    group: 1,
  },
  {
    name: '⚡ ULTRA install (with cache / no lockfile)',
    command: 'ultra install --ignore-scripts',
    pre: `${delCommand} node_modules ultra.lock`,
    spinner: ora(
      chalk.green(`Running "ULTRA install (with cache / no lockfile)"...`),
    ).stop(),
    group: 2,
  },
  {
    name: '⚡ ULTRA install (with cache / with lockfile)',
    command: 'ultra install --ignore-scripts',
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "ULTRA install (with cache / with lockfile)"...`),
    ).stop(),
    group: 3,
  },
  {
    name: '⚡ ULTRA install (with node_modules)',
    command: 'ultra install --ignore-scripts',
    spinner: ora(
      chalk.green(`Running "ULTRA install (with node_modules)"...`),
    ).stop(),
    group: 4,
  },
  {
    name: '⚡ ULTRA install (add dep)',
    command: 'ultra install axios --ignore-scripts',
    spinner: ora(chalk.green(`Running "ULTRA install (add dep)"...`)).stop(),
    group: 5,
  },
  {
    name: 'PNPM install (no cache / no lockfile)',
    command:
      'pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store',
    pre: `npm cache clean -f && pnpm store prune && ${delCommand} node_modules pnpm-lock.yaml ${homeDir}.local/share/pnpm/store/v3 cache/`,
    spinner: ora(
      chalk.green(`Running "PNPM install (no cache / no lockfile)"...`),
    ).stop(),
    group: 1,
  },
  {
    name: 'PNPM install (with cache / no lockfile)',
    command:
      'pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store',
    pre: `${delCommand} node_modules pnpm-lock.yaml`,
    spinner: ora(
      chalk.green(`Running "PNPM install (with cache / no lockfile)"...`),
    ).stop(),
    group: 2,
  },
  {
    name: 'PNPM install (with cache / with lockfile)',
    command:
      'pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store',
    pre: `${delCommand} node_modules`,
    spinner: ora(chalk.green(`Running "PNPM install (with cache)"...`)).stop(),
    group: 3,
  },
  {
    name: 'PNPM install (with node_modules)',
    command:
      'pnpm install --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store',
    spinner: ora(
      chalk.green(`Running "PNPM install (with node_modules)"...`),
    ).stop(),
    group: 4,
  },
  {
    name: 'PNPM install (add dep)',
    command:
      'pnpm install axios --force --ignore-scripts --cache-dir=cache/cache --store-dir=cache/store',
    spinner: ora(chalk.green(`Running "PNPM install (add dep)"...`)).stop(),
    group: 5,
  },
  {
    name: 'Bun install (no cache / no lockfile)',
    command: 'bun install',
    pre: `npm cache clean -f && ${delCommand} ${homeDir}.bun bun.lockb node_modules package-lock.json yarn.lock`,
    spinner: ora(
      chalk.green(`Running "Bun install (no cache / no lockfile)"...`),
    ).stop(),
    group: 1,
  },
  {
    name: 'Bun install (with cache / no lockfile)',
    command: 'bun install',
    pre: `${delCommand} node_modules bun.lockb package-lock.json yarn.lock`,
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / no lockfile)"...`),
    ).stop(),
    group: 2,
  },
  {
    name: 'Bun install (with cache / with lockfile)',
    command: 'bun install',
    pre: `${delCommand} node_modules`,
    spinner: ora(
      chalk.green(`Running "Bun install (with cache / with lockfile)"...`),
    ).stop(),
    group: 3,
  },
  {
    name: 'Bun install (with node_modules)',
    command: 'bun install',
    spinner: ora(
      chalk.green(`Running "Bun install (with node_modules)"...`),
    ).stop(),
    group: 4,
  },
  {
    name: 'Bun install (add dep)',
    command: 'bun add axios',
    spinner: ora(chalk.green(`Running "Bun install (add dep)"...`)).stop(),
    group: 5,
  },
];

export async function benchmark(args: string[]) {
  const pkg = readPackage(path.join(__dirname, '..', '..', 'package.json'));
  const currentPkg = readPackage(path.join(process.cwd(), 'package.json'));
  // If the user passed flag --only-ultra, we only run the ultra tests
  const onlyultra = args.includes('--only-ultra');
  const ignoreBun = args.includes('--ignore-bun');
  const ignorePnpm = args.includes('--ignore-pnpm');
  const addDeps = args.includes('--add-deps');
  const genjson = args.includes('--json');

  if (onlyultra) ora(chalk.yellow('Only running ultra tests')).warn();

  const selectedGroup = args
    .find((arg) => arg.startsWith('--group='))
    ?.replace('--group=', '');

  let testsToRun = !selectedGroup
    ? onlyultra
      ? tests.filter((test) => test.name.includes('ULTRA'))
      : tests
    : tests.filter((test) => test.group === parseInt(selectedGroup));

  // If the user passed flag --ignore-bun, we remove the Bun tests
  if (ignoreBun) {
    const firstBunTestIndex = testsToRun.findIndex((test) =>
      test.name.includes('Bun'),
    );
    testsToRun.splice(firstBunTestIndex, 4);
    ora(
      chalk.yellow(
        `Bun tests have been ignored. To run them, remove the --ignore-bun flag.`,
      ),
    ).warn();
  }

  if (ignorePnpm) {
    const firstPnpmTestIndex = testsToRun.findIndex((test) =>
      test.name.includes('PNPM'),
    );
    testsToRun.splice(firstPnpmTestIndex, 4);
    ora(
      chalk.yellow(
        `Pnpm tests have been ignored. To run them, remove the --ignore-pnpm flag.`,
      ),
    ).warn();
  }

  if (addDeps) {
    // We only run the add deps tests
    testsToRun = testsToRun.filter((test) => test.group === 5);
  } else {
    // We remove the add deps tests
    testsToRun = testsToRun.filter((test) => test.group !== 5);
  }

  const __init = ora(chalk.green('Starting benchmark...')).start();

  await execa('npm', [
    'install',
    '-g',
    'yarn@latest',
    'pnpm@latest',
    'npm@latest',
  ]).catch((err) => {});

  __init.succeed('Benchmark started');

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
      if (test.pre) {
        exec(test.pre, (error, stdout, stderr) => {
          if (error) {
            resolve(error);
            ora(chalk.red(`[Error] ${error}`)).fail();
          } else {
            resolve(stdout);
          }
        });
      } else {
        resolve(true);
      }
    });

    if (
      test.name === 'Bun install (no cache / no lockfile)' ||
      test.name === 'Bun install (with cache / no lockfile)'
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
              ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`,
            ),
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
          ` - ${Math.round((performance.now() - start) / 1000)}s elapsed`,
        ),
    );
    test.spinner.succeed();

    if (test.name.includes('add dep')) {
      await execa('ultra', ['remove', 'axios']);
    }

    await sleep(5000);
    continue;
  }

  const cleaning = ora(chalk.green('Cleaning up...')).start();
  [
    'cache/store',
    'cache/cache',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'node_modules',
    'bun.lockb',
  ].forEach(async (file) => {
    await rm(path.join(process.cwd(), file), { recursive: true, force: true });
  });
  cleaning.succeed('Cleaned up');

  // Sort the results by time
  results.sort((a, b) => a.time - b.time);

  const fmt = results.map((result) => {
    return {
      name: result.name,
      // Convert to seconds or minutes if its more than 60 seconds show ❌ if there was an error
      time: result.error
        ? '❌'
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
  Current project: ${currentPkg.name} (${currentPkg.version || 'no version'})`),
  );

  // Print the results
  console.table(fmt);

  // Write the results to a markdown file
  const md = markdownTable(
    [
      ['Name', 'Time', 'Group'],
      // @ts-ignore-next-line
      ...fmt.map((result) => [result.name, result.time, result.group]),
    ],
    {
      align: ['c', 'c', 'c'],
    },
  );

  await writeFile(path.join(process.cwd(), 'results.md'), md);

  if (genjson) {
    await writeFile(
      path.join(process.cwd(), 'results.json'),
      JSON.stringify(
        results.map((result) => {
          return {
            name: result.name,
            value: result.time,
            group: result.group,
          };
        }),
        null,
        2,
      ),
    );
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
