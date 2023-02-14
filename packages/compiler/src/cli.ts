#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { join } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

const argv = yargs(hideBin(process.argv))
  .scriptName('compiler')
  .usage('Usage: $0 [options]')
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'The path to the configuration file.',
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    description: 'Whether to watch for changes',
  })
  .demandOption(['config'])
  .help('help')
  .alias('help', 'h')
  .parseSync();

(async () => {
  const start = performance.now();
  const configPath = join(process.cwd(), argv.config);
  const config = await import(configPath).then((m) => m.default);

  if (argv.watch) {
    const ctx = await esbuild.context({
      ...(config as esbuild.BuildOptions),
      logLevel: 'info',
    });
    await ctx.watch();
    return;
  }

  const results = await esbuild.build(config as esbuild.BuildOptions);
  const end = performance.now();
  console.log(chalk.green(`Build completed in ${(end - start).toFixed(2)}ms.`));
  return;
})();
