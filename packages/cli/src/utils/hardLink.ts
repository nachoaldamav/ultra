import { linkSync, lstatSync, mkdirSync, readdirSync, copyFileSync } from "fs";
import { constants } from "fs";
import path from "path";
import os from "os";
import ora from "ora";
import chalk from "chalk";

const isMac = os.platform() === "darwin";

export async function hardLink(dir: string, targetDir: string) {
  try {
    const files = readdirSync(dir);
    return await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const targetPath = path.join(targetDir, file);
        const stat = lstatSync(filePath);
        if (stat.isDirectory()) {
          mkdirSync(targetPath, { recursive: true });
          await hardLink(filePath, targetPath);
        } else {
          // Create previous folders if they don't exist
          mkdirSync(path.dirname(targetPath), { recursive: true });
          if (!isMac) {
            try {
              linkSync(filePath, targetPath);
            } catch (e: any) {
              if (e.code === "EEXIST") return;
              ora(
                chalk.red(
                  `Error: ${e.message} (file: ${filePath}, target: ${targetPath})`
                )
              ).fail();
            }
          } else {
            // Use clonefile on mac
            copyFileSync(filePath, targetPath, constants.COPYFILE_FICLONE);
          }
        }
      })
    );
  } catch (e) {
    throw e;
  }
}
