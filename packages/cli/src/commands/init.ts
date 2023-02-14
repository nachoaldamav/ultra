import path from 'path';
import prompts from 'prompts';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { __dirname } from '../utils/__dirname.js';
import samplePkg from '../utils/sample/package.js';

export async function init(args: string[]) {
  let sampleJson = samplePkg;
  if (existsSync('package.json')) {
    console.log(
      chalk.red(
        'A package.json file already exists in this directory. Please delete it before running this command.',
      ),
    );
    process.exit(1);
  }

  // Get current directory name
  const currentDir = path.basename(process.cwd());

  // If has -y just use the default values
  if (args.includes('-y') && currentDir) {
    sampleJson.name = currentDir;
    writeFileSync(
      join(process.cwd(), 'package.json'),
      JSON.stringify(sampleJson, null, 2),
    );
    console.log(`Created ${chalk.green('package.json')} with default values!`);
    return;
  }

  const responses = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'What is the name of your package?',
      initial: currentDir,
    },
    {
      type: 'text',
      name: 'version',
      message: 'What is the version of your package?',
      initial: '1.0.0',
    },
    {
      type: 'text',
      name: 'description',
      message: 'What is the description of your package?',
      initial: '',
    },
  ]);

  // If no template, just create a package.json file
  sampleJson.name = responses.name;
  writeFileSync(
    join(process.cwd(), 'package.json'),
    JSON.stringify(sampleJson, null, 2),
  );
  console.log(`Created ${chalk.green('package.json')}!`);
  process.exit(0);
}
