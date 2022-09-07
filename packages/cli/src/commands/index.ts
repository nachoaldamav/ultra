import { clear } from "./clear.js";
import install from "./install.js";
import { benchmark } from "./benchmark.js";
import upgrade from "./upgrade.js";

export function commands(args: string[]) {
  const [command, ...rest] = args;

  switch (command) {
    case "install":
      install(rest);
      break;
    case "benchmark":
      benchmark(rest);
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
