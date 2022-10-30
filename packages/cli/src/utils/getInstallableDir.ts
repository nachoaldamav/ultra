import path from "node:path";
import { existsSync, readdirSync } from "node:fs";
import semver from "semver";
import chalk from "chalk";
import ora from "ora";
import readPackage from "./readPackage.js";

export function getDir(
  manifest: any,
  parent: string | undefined,
  islocalInstalled: boolean,
  depth?: number
): string {
  try {
    const localPath = path.join(
      process.cwd(),
      "node_modules",
      manifest.name,
      "package.json"
    );
    const localPathExists = existsSync(localPath);

    const installed = localPathExists ? readPackage(localPath).version : null;

    if (installed && semver.satisfies(installed.version, manifest.version)) {
      return path.join(process.cwd(), "node_modules", manifest.name);
    }

    if (!installed || !parent) {
      return path.join(process.cwd(), "node_modules", manifest.name);
    }

    const array = parent.replace(process.cwd(), "").split("/node_modules/");

    // Check how many node_modules are in the path
    const count = array.length - 1;

    if (count === 1) {
      return path.join(parent, "node_modules", manifest.name);
    }

    const bestDepth = array.slice(0, depth || 2).join("/node_modules/");

    if (!existsSync(path.join(process.cwd(), bestDepth, manifest.name))) {
      return path.join(process.cwd(), bestDepth, "node_modules", manifest.name);
    }

    const installedVersion = readPackage(
      path.join(process.cwd(), bestDepth, manifest.name)
    ).version;

    if (
      installedVersion &&
      semver.satisfies(installedVersion, manifest.version)
    ) {
      return path.join(process.cwd(), bestDepth, "node_modules", manifest.name);
    }

    ora(
      chalk.yellow(
        `Warning: ${
          manifest.name
        } is already installed in ${bestDepth}, trying in ${array
          .slice(0, (depth || 2) + 1)
          .join("/node_modules/")}`
      )
    ).warn();

    return getDir(manifest, parent, islocalInstalled, depth ? depth + 1 : 2);
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
