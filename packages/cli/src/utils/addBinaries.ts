import path from "path";
import glob from "glob";
import chalk from "chalk";
import ora from "ora";
import { chmod, symlink } from "fs/promises";
import { _downloadSpinner } from "../utils/downloadSpinner.js";
import rpjf from "read-package-json-fast";

export async function installBins() {
  try {
    // Get all packages.json inside {cwd}/node_modules
    const packages = glob.sync(`${process.cwd()}/**/package.json`);

    ora(chalk.blue(`Installing ${packages.length} binaries...`)).info();

    const promises = packages.map(async (data) => {
      const packageJSON = await rpjf(data);
      const { bin } = packageJSON;

      const packagePath = data.slice(0, data.indexOf("/package.json"));

      if (bin) {
        const isObject = typeof bin === "object";
        const isString = typeof bin === "string";

        if (isObject) {
          const keys = Object.keys(bin);
          for (const key of keys) {
            const binPath = path.join(
              process.cwd(),
              "node_modules",
              ".bin",
              key
            );

            // Create symlink to bin file
            await symlink(path.join(packagePath, bin[key]), binPath).catch(
              (err) => {
                /*  ora(
                  chalk.red(
                    `Error installing bin from ${path.join(
                      packagePath,
                      bin[key]
                    )} to ${binPath}: ${err}`
                  )
                ).fail(); */
              }
            );

            await chmod(binPath, 0o755);

            break;
          }
          return;
        } else if (isString) {
          const binPath = path.join(process.cwd(), "node_modules", ".bin", bin);

          // Create symlink to bin file
          await symlink(path.join(packagePath, bin), binPath);

          await chmod(path.join(binPath), 0o755);
          return;
        }
      }
    });

    return await Promise.all(promises);
  } catch (error) {
    return;
  }
}
