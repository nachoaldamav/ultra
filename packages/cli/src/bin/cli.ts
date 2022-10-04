#!/usr/bin/env node
import { commands } from "../commands/index.js";
import { args } from "../utils/arguments.js";
import chalk from "chalk";
import path from "node:path";
import readPackage from "../utils/readPackage.js";
import { __dirname } from "../utils/__dirname.js";

function main() {
  const { version } = readPackage(
    path.join(__dirname, "..", "..", "package.json")
  );
  console.log(chalk.grey(`[Ultra] v${version}`));

  const argv = args();
  commands(argv);
}

main();
