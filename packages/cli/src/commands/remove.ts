import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import readPackage from "../utils/readPackage.js";

export default async function remove(args: string[]) {
  if (args.length === 0) {
    console.log(
      chalk.red("Please provide packages to remove, e.g. fnpm remove react")
    );
    return;
  }

  // Read CWD package.json
  const pkg = readPackage(process.cwd() + "/package.json");

  // Remove packages from dependencies
  for (const arg of args) {
    delete pkg.dependencies[arg];
    delete pkg.devDependencies[arg];
    delete pkg.peerDependencies[arg];
    delete pkg.optionalDependencies[arg];
  }

  // Write CWD package.json
  await writeFile(
    process.cwd() + "/package.json",
    JSON.stringify(pkg, null, 2)
  );

  console.log(chalk.green("Removed packages from package.json"));
  console.log(chalk.yellow("Run `fnpm install` to update your node_modules"));
}
