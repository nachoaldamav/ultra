import { clear } from "./clear.js";
import install from "./install.js";
import { benchmark } from "./benchmark.js";
import add from "./add.js";
import upgrade from "./upgrade.js";

export function commands(args: string[]) {
  const [command, ...rest] = args;

  switch (command) {
    case "install":
      install();
      break;
    case "benchmark":
      benchmark(rest);
      break;
    case "add":
      add(rest);
      break;
    case "clear":
      clear();
      break;
    case "upgrade":
      upgrade();
    default:
      console.log(`Unknown command: ${command}`);
  }
}
