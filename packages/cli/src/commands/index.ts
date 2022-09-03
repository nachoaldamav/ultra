import { clear } from "./clear.js";
import install from "./install.js";
import { benchmark } from "./benchmark.js";

export function commands(args: string[]) {
  const [command, ...rest] = args;

  switch (command) {
    case "install":
      install();
      break;
    case "benchmark":
      benchmark(rest);
      break;
    case "clear":
      clear;
      break;
    default:
      console.log(`Unknown command: ${command}`);
  }
}
