import yargs from "yargs";
import { valid } from "semver";
import { hideBin } from "yargs/helpers";

export async function ultraCore() {
  const args = yargs(hideBin(process.argv)).options({
    help: {
      alias: "h",
      type: "boolean",
      description: "Show help",
    },
    version: {
      alias: "v",
      type: "boolean",
      description: "Show version number",
    },
    install: {
      alias: "i",
      type: "boolean",
      description: "Install dependencies",
    },
    add: {
      alias: "a",
      type: "array",
      description: "Add dependencies",
      demmandOption: true,
      options: {
        dev: {
          alias: "d",
          type: "boolean",
          description: "Install as dev dependency",
        },
        peer: {
          alias: "p",
          type: "boolean",
          description: "Install as peer dependency",
        },
        optional: {
          alias: "o",
          type: "boolean",
          description: "Install as optional dependency",
        },
      },
      check: (argv: any) => {
        if (argv.dev && argv.peer) {
          throw new Error("Cannot install as dev and peer dependency");
        }
        if (argv.dev && argv.optional) {
          throw new Error("Cannot install as dev and optional dependency");
        }
        if (argv.peer && argv.optional) {
          throw new Error("Cannot install as peer and optional dependency");
        }

        // Check all dependencies are valid semver
        for (const dep of argv._) {
          const version = getVersion(dep);
          if (version === "no_version") continue;
          if (!valid(version)) {
            throw new Error(`Invalid version: ${version}`);
          }
        }
      },
    },
  }).argv;
  console.log(args);
}

function getVersion(dep: string) {
  const splitted = dep.split("@");
  console.log(splitted);
  if (dep.startsWith("@")) {
    if (splitted.length <= 2) return "no_version";
    return splitted[2];
  }

  if (splitted.length === 1) return "no_version";
  return splitted[1];
}
