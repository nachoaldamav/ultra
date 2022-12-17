import { execa } from "execa";
import pacote from "pacote";
import ora from "ora";
import chalk from "chalk";

export async function upgrade() {
  const spinner = ora("Upgrading to latest version...").start();

  await execa("npm", ["install", "--locate=global", "ultra-pkg@latest"]);

  // Get the latest version of ultra
  const { version } = await pacote.manifest("ultra-pkg");

  spinner.succeed(chalk.green(`Ultra upgraded to v`) + chalk.blue(version));
}
