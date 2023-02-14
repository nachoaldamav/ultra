import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import ora from 'ora';
import path from 'node:path';

export async function installLocalDep(pkg: { name: string; version: string }) {
  // Create symlink from local package to node_modules
  try {
    const pkgProjectDir = path.join(process.cwd(), 'node_modules', pkg.name);
    const pkgLocalDir = path.join(process.cwd(), pkg.version.split('file:')[1]);

    if (existsSync(pkgProjectDir)) {
      rmSync(pkgProjectDir, { recursive: true });
      mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
      symlinkSync(pkgLocalDir, pkgProjectDir, 'junction');
      return;
    } else {
      mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
      symlinkSync(pkgLocalDir, pkgProjectDir, 'junction');
      return;
    }
  } catch (error: any) {
    ora(chalk.red(`Error installing ${pkg.name}@${pkg.version}`)).fail();
  }
}
