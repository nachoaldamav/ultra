import chalk from "chalk";
import ora from "ora";
import pacote from "pacote";

export default async function checkVersion() {
  // Get installed version of @snpm-io/cli
  const installedVersion = require("../../package.json").version;

  // Get latest version of @snpm-io/cli
  const { version } = await pacote.manifest("@snpm-io/cli");

  // If installed version is not the same as latest version, print a warning
  if (installedVersion !== version) {
    ora(
      chalk.yellow(
        `You are using an outdated version of @snpm-io/cli. Please update to the latest version by running ${chalk.cyan(
          "npm i -g @snpm-io/cli"
        )}`
      )
    ).warn();
  }

  return;
}
