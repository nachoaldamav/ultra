#!/usr/bin/env node
import { commands } from "../commands/index.js";
import { args } from "../utils/arguments.js";
import chalk from "chalk";
import path from "node:path";
import readPackage from "../utils/readPackage.js";
import { __dirname } from "../utils/__dirname.js";
import "../utils/globals.js";

function main() {
  const { version } = readPackage(
    path.join(__dirname, "..", "..", "package.json")
  );

  console.log(
    chalk.grey(
      `[Ultra] v${version} (${(process.uptime() * 1000).toFixed(2)}ms)`
    )
  );

  const argv = args();

  commands(argv);
}

main();
