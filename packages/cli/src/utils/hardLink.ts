import chalk from "chalk";
import { link, lstat, mkdir, readdir } from "fs/promises";
import ora from "ora";
import path from "path";

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
          await link(filePath, targetPath);
        }
      })
    );
  } catch (e) {
    throw e;
  }
}
