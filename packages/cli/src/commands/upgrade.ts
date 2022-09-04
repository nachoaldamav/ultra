import { execa } from "execa";
import pacote from "pacote";
import ora from "ora";
import chalk from "chalk";

export default async function upgrade() {
  const spinner = ora("Upgrading to latest version...").start();

  await execa("npm", ["install", "-g", "@snpm-io/cli@latest"]);

  // Get the latest version of @snpm-io/cli
  const { version } = await pacote.manifest("@snpm-io/cli");

  spinner.succeed(chalk.green(`SNPM upgraded to v`) + chalk.blue(version));
}
