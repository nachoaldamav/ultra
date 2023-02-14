import '@ultrapkg/globals';
import { logger } from '@ultrapkg/logger';
import yargs from 'yargs';
import { coerce } from 'semver';
import { hideBin } from 'yargs/helpers';
import { getVersion } from './utils/get-version';

export async function ultraCore(argv?: string) {
  logger.add('init', {
    text: `[Ultra] v0.0.1 (${(process.uptime() * 1000).toFixed(0)}ms)`,
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
      },
    )
    .command(
      'remove [packages...]',
      'Removes the specified packages.',
      (yargs) => {
        yargs.positional('packages', {
          type: 'string',
          description: 'The packages to remove.',
        });
      },
    )
    .command(
      'upgrade [packages...]',
      'Upgrades the specified packages.',
      (yargs) => {
        yargs.positional('packages', {
          type: 'string',
          description: 'The packages to upgrade.',
        });
      },
    )
    .command('install', 'Installs all dependencies.', (yargs) => {
      yargs.alias('install', 'i').option('where', {
        alias: 'w',
        type: 'string',
        description: 'The directory to install in.',
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
    .version('version', 'Prints the version of Ultra.', '0.0.1')
    .help('help')
    .parseSync();

  const command = args._[0] as string;

  if (command === 'install' || command === 'i') {
    const { install } = await import('./commands/install');
    await install(args);
  } else if (command === 'add' || command === 'a') {
    const { add } = await import('./commands/add');
    await add(args);
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
