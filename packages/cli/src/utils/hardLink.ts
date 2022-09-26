import chalk from "chalk";
import { link, lstat, mkdir, readdir, copyFile } from "fs/promises";
import { constants } from "fs";
import ora from "ora";
import path from "path";
import os from "os";

const isMac = os.platform() === "darwin";

export async function hardLink(dir: string, targetDir: string) {
  try {
    const files = await readdir(dir);
    return await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const targetPath = path.join(targetDir, file);
        const stat = await lstat(filePath);
        if (stat.isDirectory()) {
          await mkdir(targetPath).catch((e) => {
            if (e.code !== "EEXIST") return;
            if (e.code === "ENOENT") ora(chalk.red(e.message)).fail();
          });
          await hardLink(filePath, targetPath);
        } else {
          // Create previous folders if they don't exist
          await mkdir(path.dirname(targetPath), { recursive: true });
          if (!isMac) {
            await link(filePath, targetPath).catch((e) => {
              if (e.code === "EEXIST") {
                return;
              }
              ora(chalk.red(e.message)).fail();
            });
          } else {
            // Use clonefile on mac
            await copyFile(
              filePath,
              targetPath,
              constants.COPYFILE_FICLONE
            ).catch((e) => {
              if (e.code === "EEXIST") {
                return;
              }
              ora(chalk.red(e.message)).fail();
            });
          }
        }
      })
    );
  } catch (e) {
    throw e;
  }
}
