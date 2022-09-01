import chalk from "chalk";
import pacote from "pacote";
import os from "os";
import { _downloadSpinner } from "./downloadSpinner.js";

const userSnpmCache = `${os.homedir()}/.snpm-cache`;

export async function downloadPackage(
  tarball: string,
  name: string,
  pathName: string
) {
  try {
    await pacote.extract(tarball, pathName, {
      cache: userSnpmCache,
    });
    _downloadSpinner.text = chalk.green(`Downloaded ${name}!`);
    return;
  } catch (error) {
    return;
  }
}
