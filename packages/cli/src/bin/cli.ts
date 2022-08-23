#!/usr/bin/env node
import { commands } from "../commands/index.js";
import { args } from "../utils/arguments.js";

function main() {
  const argv = args();
  commands(argv);
}

main();
