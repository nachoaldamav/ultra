import path from "path";
import rpjf from "read-package-json-fast";
import ora from "ora";
import chalk from "chalk";
import { spawn } from "child_process";
import { readdirSync } from "fs";
import { execa } from "execa";

export default async function run(args: Array<string>) {
  const pkg = await rpjf(path.join(process.cwd(), "package.json"));
  const { scripts } = pkg;
  const script = scripts[args[0]];

  // Get binaries from node_modules/.bin
  const binPath = path.join(process.cwd(), "node_modules", ".bin");
  const binaries = readdirSync(binPath);

  if (!script) {
    ora().fail(chalk.red(`No script found for ${args[0]}`));
    // Show all scripts
    ora().info(chalk.blue("Available scripts:"));
    Object.keys(scripts).forEach((script) => {
      ora().info(chalk.blue(script));
    });
  }

  ora().info(chalk.blue(`Running ${chalk.grey(script)}...`));

  // Separate scripts to run by &&
  const scriptsToRun = script.split("&&").map((s: string) => s.trim());

  // Run each script
  scriptsToRun.forEach((script: string) => {
    // Get the binary
    const binary = script.split(" ")[0];

    // Get the args
    const binaryArgs = script.replace(binary, "");

    // Check if the binary is in the node_modules/.bin
    if (binaries.includes(binary)) {
      const regxp = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g;

      const args = binaryArgs.match(regxp);

      // Parse args and add the binary path to the first arg if its a binary
      const parsedArgs = args?.map((arg, index) => {
        // Remove quotes
        const i = arg.replace(/"/g, "");
        const command = i.split(" ")[0];
        if (binaries.includes(command)) {
          arg = path.join(binPath, command) + i.replace(command, "");
        }
        return arg;
      }) || [...binaryArgs];

      // Run the binary
      execa(path.join(binPath, binary), [...parsedArgs], {
        stdio: "inherit",
      });
    } else {
      // Run the script
      spawn(script, {
        stdio: "inherit",
        shell: true,
      });
    }
  });
}
