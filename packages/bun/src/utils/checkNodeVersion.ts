import chalk from "chalk";
import ora from "ora";
import semver from "semver";

export default async function checkNodeVersion(engines: any) {
  if (!engines || !engines.node) {
    return;
  }

  const { node } = engines;
  const currentVersion = process.version;
  const requiredVersion = node;

  if (!semver.satisfies(currentVersion, requiredVersion)) {
    ora().warn(
      chalk.yellow(
        `Node version ${currentVersion} does not satisfy required version ${requiredVersion}`
      )
    );
  }
}
