import path from "path";
import ora from "ora";
import chalk from "chalk";
import { spawn } from "child_process";
import { execa } from "execa";
import checkNodeVersion from "../utils/checkNodeVersion.js";
import readPackage from "../utils/readPackage.js";
import { getBinaries } from "../utils/getBinaries.js";

export async function run(args: Array<string>) {
  const pkg = readPackage(path.join(process.cwd(), "package.json"));

  if (args.length === 0) {
    console.log(chalk.red("Please provide a script to run"));
    // Show all scripts in the package.json
    console.log(chalk.green("Available scripts:"));
    Object.keys(pkg.scripts).forEach((script) => {
      console.log(chalk.blueBright(`- ${script}`));
    });
    process.exit(0);
  }

  await checkNodeVersion(pkg.engines);

  const { scripts } = pkg;
  const script = scripts[args[0]];

  // Get binaries from node_modules/.bin
  const binPath = path.join(process.cwd(), "node_modules", ".bin");
  const binaries = getBinaries(binPath);

  if (!script) {
    ora().fail(chalk.red(`No script found for ${args[0]}`));
    // Show all scripts
    ora().info(chalk.blue("Available scripts:"));
    Object.keys(scripts).forEach((script) => {
      ora().info(chalk.blueBright(script));
    });
  }

  const spinner = ora({
    text: chalk.blue(`Running ${args[0]} script`),
    color: "blue",
  });

  spinner.stopAndPersist({
    symbol: chalk.blue("ℹ️"),
  });

  // Extract env variabled at the start of the script VARIABLE=ENV
  const envVariables = getEnvVariables(script);

  ora(
    chalk.blue(
      `Running ${args[0]} script with ${envVariables.length} env variables`
    )
  ).info();

  // Extract the script without the env variables
  const scriptToRun = script.replace(envVariables.join(" "), "");

  // Separate scripts to run by &&
  const scriptsToRun = scriptToRun.split("&&").map((s: string) => s.trim());

  // Run each script
  for await (const script of scriptsToRun) {
    // Get the binary
    const binary = script.split(" ")[0];

    // Get the args
    const binaryArgs = script.replace(binary, "");

    // Check if the binary is in the node_modules/.bin
    if (binaries.includes(binary)) {
      const regxp = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g;

      const args = binaryArgs.match(regxp);

      // Parse args and add the binary path to the first arg if its a binary
      const parsedArgs = args?.map((arg: string) => {
        // Remove quotes
        const i = arg.replace(/"/g, "");
        const command = i.split(" ")[0];
        if (binaries.includes(command)) {
          arg = path.join(binPath, command) + i.replace(command, "");
        }
        return arg;
      }) || [...binaryArgs];

      // Run the binary
      execa(`${path.join(binPath, binary)}`, [...parsedArgs], {
        stdio: "inherit",
      }).catch((e) => {
        process.exit(1);
      });
    } else {
      // Run the script
      spawn(`${envVariables.join(" ")} ${script}`, {
        stdio: "inherit",
        shell: true,
      }).on("exit", (code) => {
        if (code !== 0) {
          process.exit(1);
        }
      });
    }
  }
}

function getEnvVariables(script: string) {
  const splits = script.split(" ");
  // Get splits that maches VARIABLE=ENV
  const variables = splits.filter((s) => s.match(/=/));
  return variables;
}
