import fs from "fs";
import path from "path";
import {
  rename,
  mkdir,
  rm,
  writeFile,
  chmod,
  readFile,
  symlink,
} from "fs/promises";
import ora from "ora";
import chalk from "chalk";
import pacote from "pacote";
import rpj from "read-package-json-fast";
import glob from "glob";

export async function downloadPackage(
  tarball: string,
  name: string,
  parentFolder?: string | null
) {
  // First remove package if it already exists in node_modules
  const packagePath =
    parentFolder && parentFolder !== ""
      ? path.join(
          process.cwd(),
          "node_modules",
          parentFolder,
          "node_modules",
          name
        )
      : path.join(process.cwd(), "node_modules", name);

  try {
    if (fs.existsSync(packagePath)) {
      await rm(packagePath, { recursive: true });
    }

    await pacote.extract(tarball, packagePath).catch((error) => {
      ora(
        chalk.red(
          `Error downloading ${name}: ${JSON.stringify(error, null, 0)}`
        )
      ).fail();
    });

    // Search for package.json in packagePath
    const packages = glob.sync(path.join(packagePath, "**/package.json"), {
      // Ignore sub nodes_modules folders
      ignore: [path.join(packagePath, "**/node_modules/**")],
    });

    if (packages.length === 0) {
      return;
    }

    if (name === "react-scripts")
      ora(
        chalk.blue(`${name} has ${packages.length} package.json files`)
      ).info();

    for (const packageJSONFile of packages) {
      const packageJSON = await rpj(packageJSONFile);
      const { bin } = packageJSON;
      if (bin) {
        // Create .bin folder if it doesn't exist
        const binPath = path.join(process.cwd(), "node_modules", ".bin");

        if (!fs.existsSync(binPath)) {
          await mkdir(binPath);
        }

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
            await symlink(path.join(packagePath, bin[key]), binPath);

            await chmod(binPath, 0o755);
            break;
          }
          break;
        } else if (isString) {
          const binPath = path.join(process.cwd(), "node_modules", ".bin", bin);

          // Create symlink to bin file
          await symlink(path.join(packagePath, bin), binPath);

          await chmod(path.join(binPath), 0o755);
          break;
        }
      }
    }
  } catch (error) {
    ora(
      chalk.red(`Error installing ${name}: ${JSON.stringify(error, null, 0)}`)
    ).fail();
  }
}
