import chalk from "chalk";
import ora from "ora";
import { satisfies } from "compare-versions";

export default async function checkNodeVersion(engines: any) {
  if (!engines.node) {
    return;
  }

  const { node } = engines;
  const currentVersion = process.version;
  const requiredVersion = node;

  if (!satisfies(currentVersion, requiredVersion)) {
    ora().warn(
      chalk.yellow(
        `Node version ${currentVersion} does not satisfy required version ${requiredVersion}`
      )
    );
  }
}
