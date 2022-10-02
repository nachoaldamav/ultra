import path from "path";
import glob from "glob";
import chalk from "chalk";
import ora from "ora";
import { chmodSync, symlinkSync } from "node:fs";
import readPackage from "./readPackage.js";

export async function installBins() {
  try {
    // Get all packages.json inside {cwd}/node_modules
    const packages = glob.sync("**/package.json", {
      cwd: path.join(process.cwd(), "node_modules"),
    });

    // Short packages to show first the nearest to root
    packages.sort((a, b) => a.split("/").length - b.split("/").length);

    return await Promise.allSettled(
      packages.map(async (data) => {
        const packageJSON = readPackage(
          path.join(process.cwd(), "node_modules", data)
        );
        const { bin } = packageJSON;

        const packagePath = path.join(
          process.cwd(),
          "node_modules",
          packageJSON.name
        );

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
              symlinkSync(path.join(packagePath, bin[key]), binPath);

              chmodSync(binPath, 0o755);

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
            symlinkSync(path.join(packagePath, bin), binPath);

            chmodSync(path.join(binPath), 0o755);
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
