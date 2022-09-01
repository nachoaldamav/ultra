import { clear } from "./clear.js";
import install from "./install.js";

export function commands(args: string[]) {
  const [command, ...rest] = args;

  switch (command) {
    case "install":
      install();
      break;
    case "clear":
      clear;
      break;
    default:
      console.log(`Unknown command: ${command}`);
  }
}
