import { execa } from "execa";
import pacote from "pacote";
import ora from "ora";
import chalk from "chalk";

export default async function upgrade() {
  const spinner = ora("Upgrading to latest version...").start();

  await execa("npm", ["install", "-g", "ultrapkg@latest"]);

  // Get the latest version of fnpm
  const { version } = await pacote.manifest("ultra-pkg");

  spinner.succeed(chalk.green(`FNPM upgraded to v`) + chalk.blue(version));
}
