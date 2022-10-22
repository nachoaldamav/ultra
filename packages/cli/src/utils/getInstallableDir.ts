import { existsSync } from "node:fs";
import path from "node:path";
import semver from "semver";
import chalk from "chalk";
import ora from "ora";
import readPackage from "./readPackage.js";

export function getDir(
  manifest: any,
  parent: string | undefined,
  islocalInstalled: boolean
) {
  try {
    if (!islocalInstalled || !parent) {
      return path.join(process.cwd(), "node_modules", manifest.name);
    }

    // Check how many node_modules are in the path
    const count = parent.split("node_modules").length - 1;
    if (count === 1) {
      return path.join(parent, "node_modules", manifest.name);
    }

    // Check if the dir exists in previous node_modules
    const dir = path.join(
      process.cwd(),
      "node_modules",
      parent.split("node_modules")[1],
      "node_modules",
      manifest.name
    );

    if (!existsSync(dir)) {
      return dir;
    }

    // If it exists, check if the version is suitable with manifest.spec
    const pkg = readPackage(path.join(dir, "package.json"));

    if (semver.satisfies(pkg.version, manifest.spec)) {
      return dir;
    }

    const splitted = parent.split("node_modules");
    const duplicates = hasDuplicates(splitted);

    if (duplicates) {
      return null;
    }

    // Check if there any package in splitted is repeated, if so, return null
    const repeated = splitted.filter((item) => {
      return splitted;
    });

    return path.join(parent, "node_modules", manifest.name);
  } catch (e: any) {
    ora(
      chalk.red(
        `Error while installing ${manifest.name}@${
          manifest.version
        } - ${e.toString()}`
      )
    ).fail();

    return parent
      ? path.join(parent, "node_modules", manifest.name)
      : path.join(process.cwd(), "node_modules", manifest.name);
  }
}

function hasDuplicates(array: Array<string>) {
  return new Set(array).size !== array.length;
}
