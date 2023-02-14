import os from 'os';
import { mkdir, rm } from 'node:fs/promises';
import path from 'path';
import ora from 'ora';
import glob from 'glob';
import { readPackage } from '@ultrapkg/read-package';

export async function clear() {
  const cacheFolder = `${os.homedir()}/.ultra-cache`;
  const packageJson = `${process.cwd()}/package.json`;
  const tmpCacheFolder = path.join(os.tmpdir(), 'ultra_tmp');
  const manifestsFolder = path.join(os.homedir(), '.ultra', '__manifests__');
  const pkg = readPackage(packageJson);
  const workspaces = pkg.workspaces || null;

  const __clear = ora('Clearing cache...').start();
  await rm(cacheFolder, { recursive: true, force: true }).catch(() => {});
  await rm(`${process.cwd()}/ultra.lock`, { force: true }).catch(() => {});
  await rm(tmpCacheFolder, { recursive: true, force: true }).catch(() => {});
  await rm(manifestsFolder, { recursive: true, force: true }).catch(() => {});
  __clear.succeed('Cleared cache!');

  await mkdir(cacheFolder, { recursive: true });

  const __modules = ora('Clearing node_modules...').start();
  await rm(path.join(process.cwd(), 'node_modules'), {
    recursive: true,
    force: true,
  });
  __modules.succeed('Cleared node_modules!');

  if (workspaces) {
    const __workspaces = ora('Clearing workspaces...').start();
    await Promise.all(
      workspaces.map(async (workspace: string) => {
        const packages = glob.sync(`${workspace}/package.json`);
        await Promise.all(
          packages.map(async (pkg) => {
            await rm(path.join(path.dirname(pkg), 'node_modules'), {
              recursive: true,
              force: true,
            });
          }),
        );
      }),
    );
    __workspaces.succeed('Cleared workspaces!');
  }

  ora('Cleared all packages!').succeed();
}
