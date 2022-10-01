import chalk from "chalk";
import { existsSync } from "fs";
import { lstat, readdir } from "fs/promises";
import ora from "ora";
import os from "os";
import path from "path";

export default async function list(pkgs: string[]) {
  if (!pkgs) {
    ora(chalk.red("Missing package name")).fail();
    const packages = await readdir(path.join(os.homedir(), ".fnpm-cache"));
    console.log(
      chalk.green(
        `${chalk.blue(packages.length)} packages installed with FNPM.`
      )
    );
    return;
  }

  pkgs.forEach(async (pkg) => {
    const pathName = path.join(os.homedir(), ".fnpm-cache", pkg);

    if (!existsSync(pathName)) {
      ora(chalk(`${pkg} is not installed with FNPM!`)).fail();
      return;
    }

    const dir = await lstat(pathName);

    if (dir.isDirectory()) {
      const versions = await readdir(pathName);
      console.log(
        `${chalk.blue(versions.length)} version${
          versions.length > 1 ? "s" : ""
        } of ${chalk.green(pkg)} ${
          versions.length > 1 ? "are" : "is"
        } installed:`
      );
      for (const version of versions) {
        console.log(chalk.grey("-") + " " + version);
      }
    }
  });
}
