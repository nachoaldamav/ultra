import ora from "ora";
import chalk from "chalk";
import pacote from "pacote";
import prompts from "prompts";
import path from "path";
import rpjf from "read-package-json-fast";
import { execa } from "execa";
import { existsSync, rm, rmSync, symlinkSync } from "fs";
import { spawn } from "child_process";

export default async function create(args: string[]) {
  if (args.length === 0) {
    console.log(
      chalk.red(
        "Please provide the script name, e.g. snpm create create-next-app"
      )
    );
    return;
  }

  const command = args[0];
  args.shift();

  const spinner = ora(`Searching ${command} in NPM Registry...`).start();
  const manifest = await pacote.manifest(command);
  spinner.succeed();
  spinner.text = `Found ${command} in NPM Registry`;

  const { install } = await prompts({
    type: "confirm",
    name: "install",
    message: `Do you want to install ${manifest.name} (${chalk.grey(
      "v" + manifest.version
    )})?`,
    initial: true,
  });

  if (install) {
    // Get global config path
    const npmPath = await execa("npm", ["config", "get", "prefix"]).then(
      (res) => res.stdout
    );

    const globalPath = path.join(npmPath, "lib", "node_modules", manifest.name);

    const __downloading = ora(`Downloading ${manifest.name}...`).start();
    await pacote.extract(command, globalPath);
    __downloading.succeed();

    // Get bin path
    const bin = await rpjf(globalPath + "/package.json").then(
      (res: any) => res.bin
    );

    const isObject = bin && typeof bin === "object";
    const binName = isObject ? Object.keys(bin)[0] : bin;

    const binPath = isObject ? bin[binName] : bin;

    // Check if symlink exists
    const symlinkPath = path.join(npmPath, "bin", binName);

    if (existsSync(symlinkPath)) {
      rmSync(symlinkPath);
    }

    // Create symlink
    symlinkSync(
      path.join(globalPath, binPath),
      path.join(npmPath, "bin", binName)
    );

    // Execute the script with spawn
    spawn(binName, args, {
      stdio: "inherit",
      shell: true,
    });
  }
  return;
}
