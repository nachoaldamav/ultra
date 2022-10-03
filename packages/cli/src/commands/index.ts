import { clear } from "./clear.js";
import install from "./install.js";
import { benchmark } from "./benchmark.js";
import upgrade from "./upgrade.js";
import list from "./list.js";
import checkVersion from "../utils/checkVersion.js";
import run from "./run.js";
import { update } from "../utils/readConfig.js";
import create from "./create.js";
import remove from "./remove.js";
import autocompletion from "./autocompletion.js";
import { performance } from "perf_hooks";
import ora from "ora";
import test from "./test.js";
import installBeta from "./install-beta.js";

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
    name: "install-beta",
    description: "Install a package (beta)",
    command: installBeta,
    abr: "ib",
    params: true,
  },
];

export async function commands(args: string[]) {
  const [command, ...rest] = args;

  const comm = comms.find((c) => c.name === command || c.abr === command);

  if (comm) {
    // @ts-ignore-next-line
    return comm.command(rest);
  }

  console.log("Unknown command");
  console.log("Available commands:");
  comms.forEach((c) => {
    console.log(`- ${c.name}: ${c.description}`);
  });
}
