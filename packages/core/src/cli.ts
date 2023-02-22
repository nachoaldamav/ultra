#!/usr/bin/env node
import '@ultrapkg/globals';
import { logger } from '@ultrapkg/logger';
import { readPackage } from '@ultrapkg/read-package';
import { UltraError } from '@ultrapkg/error-logger';
import { dirname, join } from 'path';
import yargs from 'yargs';
import { coerce } from 'semver';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import { getVersion } from './utils/get-version';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ultraVersion = readPackage(join(__dirname, '../package.json')).version;

async function ultraCore(argv?: string) {
  logger.add('init', {
    text: `[Ultra] v${ultraVersion} (${(process.uptime() * 1000).toFixed(
      0
    )}ms)`,
    color: 'gray',
    status: 'non-spinnable',
  });

  const args = yargs(argv || hideBin(process.argv))
    .scriptName('ultra')
    .usage('Usage: $0 [options]')
    .command(
      'add [packages...]',
      'Installs the specified packages.',
      (yargs) => {
        yargs
          .alias('add', 'a')
          .positional('packages', {
            type: 'string',
            description: 'The packages to install.',
          })
          .option('dev', {
            alias: 'D',
            type: 'boolean',
            description: 'Whether to install as a dev dependency.',
          })
          .option('exact', {
            alias: 'E',
            type: 'boolean',
            description: 'Whether to install the exact version.',
          })
          .option('peer', {
            alias: 'P',
            type: 'boolean',
            description: 'Whether to install as a peer dependency.',
          })
          .option('optional', {
            alias: 'O',
            type: 'boolean',
            description: 'Whether to install as an optional dependency.',
          });
      }
    )
    .command(
      'remove [packages...]',
      'Removes the specified packages.',
      (yargs) => {
        yargs.positional('packages', {
          type: 'string',
          description: 'The packages to remove.',
        });
      }
    )
    .command(
      'upgrade [packages...]',
      'Upgrades the specified packages.',
      (yargs) => {
        yargs.positional('packages', {
          type: 'string',
          description: 'The packages to upgrade.',
        });
      }
    )
    .command('install', 'Installs all dependencies.', (yargs) => {
      yargs.alias('install', 'i').option('where', {
        alias: 'w',
        type: 'string',
        description: 'The directory to install in.',
      });
    })
    .command('run [script]', 'Runs the specified script.', (yargs) => {
      yargs.positional('script', {
        type: 'string',
        description: 'The script to run.',
      });
    })
    .check((argv) => {
      if (argv.packages as string[]) {
        if ((argv.packages as string[]).length === 0) {
          throw new Error('No packages specified.');
        }
        for (const dep of argv.packages as string[]) {
          const parsed = getVersion(dep);
          if (parsed === 'no_version') continue;
          const version = coerce(parsed);
          if (!version) {
            throw new Error(`Invalid version: ${dep}`);
          }
        }
        return true;
      }
      return true;
    })
    .check((argv) => {
      if (argv.script as string) {
        if ((argv.script as string).length === 0) {
          throw new Error('No script specified.');
        } else {
          const pkg = readPackage(join(process.cwd(), 'package.json'));
          if (!pkg.scripts || !pkg.scripts[argv.script as string]) {
            throw new UltraError(
              'ERROR_ULTRA_NO_SCRIPT_FOUND',
              `No script found with the name "${argv.script}".`,
              '@ultrapkg/core',
              true
            );
          }
        }
      }
      return true;
    })
    .version('version', 'Prints the version of Ultra.', ultraVersion)
    .help('help')
    .parseSync();

  const command = args._[0] as string;

  if (command === 'install' || command === 'i') {
    const { install } = await import('./commands/install');
    await install(args);
  } else if (command === 'add' || command === 'a') {
    const { add } = await import('./commands/add');
    await add(args);
  } else if (command === 'run') {
    const { runner } = await import('./commands/runner');
    await runner(args);
  }

  if (argv) {
    // If we're running in a test, we want to return the args after 110ms.
    // This is because the logger is async, and we want to make sure that
    // the logger has time to log before we return the args.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(args);
      }, 110);
    });
  }

  logger.stopAll();
}

ultraCore();
