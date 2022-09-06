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
    const packages = glob.sync("**/package.json", {
      cwd: path.join(process.cwd(), "node_modules"),
    });

    return await Promise.allSettled(
      packages.map(async (data) => {
        const packageJSON = await rpjf(
          path.join(process.cwd(), "node_modules", data)
        );
        const { bin } = packageJSON;

        if (bin) {
          ora(`Installing binaries for ${chalk.cyan(packageJSON.name)}`).info();
        }

        const packagePath = path.join(
          process.cwd(),
          "node_modules",
          packageJSON.name
        );

        if (bin) {
          const isObject = typeof bin === "object";
          const isString = typeof bin === "string";

          ora(
            chalk.blue(`Installing ${isObject ? Object.keys(bin)[0] : bin}`)
          ).info();

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
                  throw err;
                }
              );

              await chmod(binPath, 0o755);

              break;
            }
            return;
          } else if (isString) {
            const binPath = path.join(
              process.cwd(),
              "node_modules",
              ".bin",
              bin
            );

            // Create symlink to bin file
            await symlink(path.join(packagePath, bin), binPath).catch((err) => {
              throw err;
            });

            await chmod(path.join(binPath), 0o755);
            return;
          }
        }
      })
    );
  } catch (error) {
    ora(chalk.red(JSON.stringify(error))).fail();
    return;
  }
}
