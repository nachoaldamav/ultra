import { install } from "./install.js";

export function commands(args: string[]) {
  const [command, ...rest] = args;

  switch (command) {
    case "install":
      install(rest);
      break;
    default:
      console.log(`Unknown command: ${command}`);
  }
}
