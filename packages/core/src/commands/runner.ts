import { UltraError } from '@ultrapkg/error-logger';
import { readPackage } from '@ultrapkg/read-package';
import { readdirSync } from 'fs';
import { join } from 'path';
import { execa } from 'execa';
import { Yargs } from '../types/yargs';

export async function runner(argv: Yargs) {
  const script = argv.script as string;
  const pkg = readPackage(join(process.cwd(), 'package.json'));
  const binaries = getBinaries(join(process.cwd(), 'node_modules', '.bin'));

  if (!pkg.scripts || !pkg.scripts[script]) {
    throw new UltraError(
      'ERROR_ULTRA_NO_SCRIPT_FOUND',
      `No script found with the name "${script}".`,
      '@ultrapkg/core'
    );
  }

  const scriptToRun = pkg.scripts[script];

  // Extract env variabled at the start of the script VARIABLE=ENV
  const envVariables = getEnvVariables(scriptToRun);

  // Extract the script without the env variables
  const scriptToRunWithoutEnv = scriptToRun.replace(envVariables.join(' '), '');

  // Separate scripts to run by &&
  const scriptsToRun = scriptToRunWithoutEnv
    .split('&&')
    .map((s: string) => s.trim());

  // Run each script
  for await (const script of scriptsToRun) {
    // Get the binary
    const binary = script.split(' ')[0];

    // Get the args
    const args = script.split(' ').slice(1);

    // Check if the binary is available in node_modules/.bin
    if (binaries.includes(binary)) {
      // If it is, run the binary
      return execa(join(process.cwd(), 'node_modules', '.bin', binary), args, {
        stdio: 'inherit',
        env: {
          ...(process.env as any),
          ...envVariables,
        },
      });
    } else {
      // If it is not, run the script
      return execa('sh', ['-c', script], {
        stdio: 'inherit',
        env: {
          ...(process.env as any),
          ...envVariables,
        },
      });
    }
  }
}

function getBinaries(binPath: string) {
  try {
    return readdirSync(binPath);
  } catch (e) {
    return [];
  }
}

function getEnvVariables(script: string) {
  const envVariables = script.match(/(\w+=[\w\d]+)(\s|$)/g);
  return envVariables || [];
}
