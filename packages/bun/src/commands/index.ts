import path from "node:path";
import readPackage from "../utils/readPackage.js";

const comms = [
  {
    name: "install",
    description: "Install a package",
    abr: "i",
    params: true,
  },
  {
    name: "benchmark",
    description: "Benchmark a package",
    abr: "b",
    params: false,
  },
  {
    name: "upgrade",
    description: "Upgrade ULTRA",
    abr: "u",
    params: false,
  },
  {
    name: "set",
    description: "Set a config value",
    abr: "s",
    params: true,
  },
  {
    name: "list",
    description: "List package versions",
    abr: "ls",
    params: true,
  },
  {
    name: "run",
    description: "Run a script",
    abr: "r",
    params: true,
  },
  {
    name: "create",
    description: "Create a new package from a template",
    abr: "c",
    params: true,
  },
  {
    name: "remove",
    description: "Remove a package",
    abr: "rm",
    params: true,
  },
  {
    name: "clear",
    description: "Clear the cache",
    abr: "c",
    params: false,
  },
  {
    name: "test",
    description: "Run a tests",
    abr: "t",
    params: true,
  },
  {
    name: "init",
    description: "Initialize a package.json file",
    abr: "init",
    params: true,
  },
  {
    name: "ci",
    description: "Run a continuous install",
    abr: "ci",
    params: false,
  },
];

export async function commands(args: string[]) {
  const [command, ...rest] = args;

  if (command === "version" || command === "-v") {
    process.exit(0);
  }

  if (command === "help" || command === "-h") {
    process.exit(0);
  } else if (command === "upgrade" || command === "u") {
    const { upgrade } = await import("./upgrade.js");
    return upgrade();
  } else if (command === "install" || command === "i") {
    const { install } = await import("./install.js");
    return install(rest);
  } else if (command === "benchmark" || command === "b") {
    const { benchmark } = await import("./benchmark.js");
    return benchmark(rest);
  } else if (command === "set" || command === "s") {
    const { update } = await import("../utils/readConfig.js");
    return update(rest);
  } else if (command === "list" || command === "ls") {
    const { list } = await import("./list.js");
    return list(rest);
  } else if (command === "run" || command === "r") {
    const { run } = await import("./run.js");
    return run(rest);
  } else if (command === "create" || command === "c") {
    const { create } = await import("./create.js");
    return create(rest);
  } else if (command === "remove" || command === "rm") {
    const { remove } = await import("./remove.js");
    return remove(rest);
  } else if (command === "clear" || command === "c") {
    const { clear } = await import("./clear.js");
    return clear();
  } else if (command === "test" || command === "t") {
    const { test } = await import("./test.js");
    return test(rest);
  } else if (command === "init" || command === "init") {
    const { init } = await import("./init.js");
    return init(rest);
  } else if (command === "ci" || command === "ci") {
    const { continuousInstall } = await import("./ci.js");
    return continuousInstall();
  } else {
    const pkg = readPackage(path.join(process.cwd(), "package.json"));

    if (pkg && pkg.scripts && pkg.scripts[command]) {
      const { run } = await import("./run.js");
      return run([command, ...rest]);
    }

    console.log("Unknown command");
    console.log("Available commands:");
    comms.forEach((c) => {
      console.log(`- ${c.name}: ${c.description}`);
    });
    process.exit(1);
  }
}
