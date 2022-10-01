import ora from "ora";
import chalk from "chalk";
import pacote from "pacote";
import prompts from "prompts";
import path from "path";
import { execa } from "execa";
import { existsSync, rm, rmSync, symlinkSync } from "fs";
import { spawn } from "child_process";
import { getDeps } from "../utils/getDeps.js";
import readPackage from "../utils/readPackage.js";

export default async function create(args: string[]) {
  if (args.length === 0) {
    console.log(
      chalk.red(
        "Please provide the script name, e.g. fnpm create create-next-app"
      )
    );
    return;
  }

  // Get global config path
  const npmPath = await execa("npm", ["config", "get", "prefix"]).then(
    (res) => res.stdout
  );

  let command = args[0];

  // If command doesn't start with create- then add it
  if (!command.startsWith("create-")) {
    command = `create-${command}`;
  }

  args.shift();

  const spinner = ora(`Searching ${command} in NPM Registry...`).start();
  const manifest = await pacote.manifest(command);
  spinner.succeed();
  spinner.text = `Found ${command} in NPM Registry`;

  // Check if the package is already installed

  const { install } = await prompts({
    type: "confirm",
    name: "install",
    message: `Do you want to install ${manifest.name} (${chalk.grey(
      "v" + manifest.version
    )})?`,
    initial: true,
  });

  if (install) {
    const globalPath = path.join(npmPath, "lib", "node_modules", manifest.name);

    const __downloading = ora(`Downloading ${manifest.name}...`).start();
    await pacote.extract(command, globalPath);
    __downloading.succeed();

    const __installing = ora(`Installing ${manifest.name}...`).start();

    const deps = getDeps(manifest, {
      dev: true,
    });

    await Promise.all(
      deps.map(async (dep: any) => {
        return await installPkg(dep.name, dep.version, globalPath);
      })
    );

    __installing.succeed();

    // Get bin path
    const bin = readPackage(globalPath + "/package.json").then(
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

async function installPkg(
  dep: string,
  version: string,
  pathname: string
): Promise<any> {
  const installPath = path.join(pathname, "node_modules", dep);

  await pacote.extract(`${dep}@${version}`, installPath);

  // Read package.json
  const pkg = readPackage(path.join(installPath, "package.json"));

  const deps = getDeps(pkg, {
    dev: true,
  });

  return await Promise.all(
    deps.map(async (dep: any) => {
      // Check if the dependency is already installed
      if (existsSync(path.join(pathname, "node_modules", dep.name))) {
        return await installPkg(dep.name, dep.version, installPath);
      }
      return await installPkg(dep.name, dep.version, pathname);
    })
  );
}
