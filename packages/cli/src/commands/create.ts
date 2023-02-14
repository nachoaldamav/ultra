import ora from 'ora';
import chalk from 'chalk';
import pacote from 'pacote';
import prompts from 'prompts';
import path from 'path';
import { execa } from 'execa';
import { existsSync } from 'node:fs';
import { spawn } from 'child_process';
import { getDeps } from '@ultrapkg/get-deps';
import { manifestFetcher } from '@ultrapkg/manifest-fetcher';
import { readPackage } from '@ultrapkg/read-package';
import binLinks from 'bin-links';
import os from 'node:os';

const operatingSystem = os.platform();

export async function create(args: string[]) {
  if (args.length === 0) {
    console.log(
      chalk.red(
        'Please provide the script name, e.g. ultra create create-next-app',
      ),
    );
    return;
  }

  // Get global config path
  const npmPath = await execa('npm', ['config', 'get', 'prefix']).then(
    (res) => res.stdout,
  );

  let command = args[0];

  // If command doesn't start with create- then add it
  if (!command.startsWith('create-')) {
    command = `create-${command}`;
  }

  args.shift();

  const spinner = ora(`Searching ${command} in NPM Registry...`).start();
  const manifest = await manifestFetcher(command, {
    registry: 'https://registry.npmjs.org/',
  });
  spinner.succeed();
  spinner.text = `Found ${command} in NPM Registry`;

  // Check if the package is already installed

  const { install } = await prompts({
    type: 'confirm',
    name: 'install',
    message: `Do you want to install ${manifest.name} (${chalk.grey(
      'v' + manifest.version,
    )})?`,
    initial: true,
  });

  if (install) {
    const globalPath =
      operatingSystem === 'win32'
        ? path.join(npmPath, 'node_modules', manifest.name)
        : path.join(npmPath, 'lib', 'node_modules', manifest.name);

    const __downloading = ora(`Downloading ${manifest.name}...`).start();
    await pacote.extract(command, globalPath);
    __downloading.succeed();

    const __installing = ora(`Installing ${manifest.name}...`).start();

    const deps = getDeps(manifest, {
      dev: true,
    });

    await Promise.all(
      deps.map(async (dep: any) => {
        return await installPkg(dep.name, dep.version, globalPath);
      }),
    );

    __installing.succeed();

    // Get bin path
    const pkg = readPackage(path.join(globalPath, 'package.json'));

    const binName = Object.keys(pkg.bin)[0];

    // Create symlink
    await binLinks({
      path: globalPath,
      pkg,
      global: true,
      force: true,
      top: true,
    });

    // Execute the script with spawn
    if (operatingSystem === 'win32') {
      spawn(`cmd.exe`, ['/c', binName, ...args], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
    } else {
      spawn(binName, args, {
        stdio: 'inherit',
        shell: true,
      });
    }
  }
  return;
}

async function installPkg(
  dep: string,
  version: string,
  pathname: string,
): Promise<any> {
  const installPath = path.join(pathname, 'node_modules', dep);

  await pacote.extract(`${dep}@${version}`, installPath);

  // Read package.json
  const pkg = readPackage(path.join(installPath, 'package.json'));

  const deps = getDeps(pkg, {
    dev: true,
  });

  return await Promise.all(
    deps.map(async (dep: any) => {
      // Check if the dependency is already installed
      if (existsSync(path.join(pathname, 'node_modules', dep.name))) {
        return installPkg(dep.name, dep.version, installPath);
      }
      return installPkg(dep.name, dep.version, pathname);
    }),
  );
}
