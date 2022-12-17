import {
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  constants,
} from "node:fs";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";

export function hardLinkSync(dir: string, targetDir: string) {
  try {
    const files = readdirSync(dir);
    return files.map((file) => {
      const filePath = path.join(dir, file);
      const targetPath = path.join(targetDir, file);
      const stat = lstatSync(filePath);
      if (stat.isDirectory()) {
        mkdirSync(targetPath, { recursive: true });
        hardLinkSync(filePath, targetPath);
      } else {
        // Create previous folders if they don't exist
        mkdirSync(path.dirname(targetPath), { recursive: true });
        try {
          linkSync(filePath, targetPath);
        } catch (e: any) {
          if (e.code === "EEXIST") return;
          if (e.code === "EXDEV")
            return copyFileSync(
              filePath,
              targetPath,
              constants.COPYFILE_FICLONE
            );
          ora(
            chalk.red(
              `Error: ${e.message} (file: ${filePath}, target: ${targetPath})`
            )
          ).fail();
        }
      }
    });
  } catch (e) {
    throw e;
  }
}
