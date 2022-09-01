import chalk from "chalk";
import pacote from "pacote";
import os from "os";
import { _downloadSpinner } from "./downloadSpinner.js";
import { symlink } from "fs/promises";
import { existsSync } from "fs";

const userSnpmCache = `${os.homedir()}/.snpm-cache`;

export async function downloadPackage(
  tarball: string,
  name: string,
  pathName: string,
  version: string
) {
  try {
    const cacheFolder = `${userSnpmCache}/${name}/${version}`;

    if (!existsSync(cacheFolder)) {
      await pacote.extract(tarball, cacheFolder, {
        cache: userSnpmCache,
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
