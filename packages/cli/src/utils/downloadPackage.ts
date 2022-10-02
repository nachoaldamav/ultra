import chalk from "chalk";
import pacote from "pacote";
import os from "os";
import { _downloadSpinner } from "./downloadSpinner.js";
import { symlink } from "node:fs/promises";
import { existsSync } from "node:fs";

const userFnpmCache = `${os.homedir()}/.fnpm-cache`;

export async function downloadPackage(
  tarball: string,
  name: string,
  pathName: string,
  version: string
) {
  try {
    const cacheFolder = `${userFnpmCache}/${name}/${version}`;

    if (!existsSync(cacheFolder)) {
      await pacote.extract(tarball, cacheFolder, {
        cache: userFnpmCache,
      });
      await symlink(cacheFolder, pathName, "dir");
    } else {
      await symlink(cacheFolder, pathName, "dir");
    }

    _downloadSpinner.text = chalk.green(`Downloaded ${name}!`);
    return;
  } catch (error) {
    return;
  }
}
