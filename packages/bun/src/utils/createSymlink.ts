import chalk from "chalk";
import { existsSync } from "node:fs";
import { mkdir, rm, symlink } from "node:fs/promises";
import ora from "ora";

export async function createSymlink(baseDir: string, targetDir: string) {
  if (existsSync(targetDir)) {
    await rm(targetDir, { recursive: true });
    const dirs = targetDir.split("/");
    dirs.pop();
    await mkdir(dirs.join("/"), { recursive: true });
    await symlink(baseDir, targetDir, "junction").catch(() => {});
    return;
  } else {
    // Create directory for package without the last folder
    const dirs = targetDir.split("/");
    dirs.pop();
    await mkdir(dirs.join("/"), { recursive: true });
    await symlink(baseDir, targetDir, "junction").catch((e) => {
      ora(
        chalk.red(`Error installing ${targetDir}! ${JSON.stringify(e)}`)
      ).fail();
    });
    return;
  }
}
