import path from "node:path";
import { clear } from "./clear.js";
import install from "./install.js";
import { benchmark } from "./benchmark.js";
import upgrade from "./upgrade.js";
import list from "./list.js";
import run from "./run.js";
import { update } from "../utils/readConfig.js";
import create from "./create.js";
import remove from "./remove.js";
import test from "./test.js";
import init from "./init.js";
import continuousInstall from "./ci.js";
import readPackage from "../utils/readPackage.js";

const comms = [
  {
    name: "install",
    description: "Install a package",
    command: install,
    abr: "i",
    params: true,
  },
  {
    name: "benchmark",
    description: "Benchmark a package",
    command: benchmark,
    abr: "b",
    params: false,
  },
  {
    name: "upgrade",
    description: "Upgrade FNPM",
    command: upgrade,
    abr: "u",
    params: false,
  },
  {
    name: "set",
    description: "Set a config value",
    command: update,
    abr: "s",
    params: true,
  },
  {
    name: "list",
    description: "List package versions",
    command: list,
    abr: "ls",
    params: true,
  },
  {
    name: "run",
    description: "Run a script",
    command: run,
    abr: "r",
    params: true,
  },
  {
    name: "create",
    description: "Create a new package from a template",
    command: create,
    abr: "c",
    params: true,
  },
  {
    name: "remove",
    description: "Remove a package",
    command: remove,
    abr: "rm",
    params: true,
  },
  {
    name: "clear",
    description: "Clear the cache",
    command: clear,
    abr: "c",
    params: false,
  },
  {
    name: "test",
    description: "Run a tests",
    command: test,
    abr: "t",
    params: true,
  },
  {
    name: "init",
    description: "Initialize a package.json file",
    command: init,
    abr: "init",
    params: true,
  },
  {
    name: "ci",
    description: "Run a continuous install",
    command: continuousInstall,
    abr: "ci",
    params: false,
  },
];

export async function commands(args: string[]) {
  const [command, ...rest] = args;

  if (command === "version" || command === "-v") {
    process.exit(0);
  }

  const comm = comms.find((c) => c.name === command || c.abr === command);

  if (comm) {
    // @ts-ignore-next-line
    return comm.command(rest);
  }

  const pkg = readPackage(path.join(process.cwd(), "package.json"));

  if (pkg && pkg.scripts && pkg.scripts[command]) {
    return run([command, ...rest]);
  }

  console.log("Unknown command");
  console.log("Available commands:");
  comms.forEach((c) => {
    console.log(`- ${c.name}: ${c.description}`);
  });
}
