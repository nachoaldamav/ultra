import path from "node:path";
import { getBinaries } from "./getBinaries.js";
import { spawn } from "child_process";
import ora from "ora";
import chalk from "chalk";

export async function executePost(
  script: string,
  depPath?: string,
  cachePath?: string
) {
  if (__NOPOSTSCRIPTS) {
    return;
  }

  // Get the binaries from CWD
  const binPath = path.join(process.cwd(), "node_modules", ".bin");
  const binaries = getBinaries(binPath);

  // Separate scripts to run by &&
  const scriptsToRun = script.split("&&").map((s: string) => s.trim());

  await Promise.all(
    scriptsToRun.map(async (script: string) => {
      // Get the binary
      const binary = script.split(" ")[0];

      // Get the args
      const binaryArgs = script.replace(binary, "");

      // Check if the binary is in the node_modules/.bin
      if (binaries.includes(binary)) {
        const regxp = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g;

        const args = binaryArgs.match(regxp);

        // Parse args and add the binary path to the first arg if its a binary
        const parsedArgs = args?.map((arg, index) => {
          // Remove quotes
          const i = arg.replace(/"/g, "");
          const command = i.split(" ")[0];
          if (binaries.includes(command)) {
            arg = path.join(binPath, command) + i.replace(command, "");
          }
          return arg;
        }) || [...binaryArgs];

        // Run the binary
        const run = spawn(path.join(binPath, binary), [...parsedArgs], {
          stdio: "pipe",
          cwd: depPath,
        });

        // Handle errors from the script
        run.on("error", function (err: any) {
          throw err;
        });

        return Promise.resolve(
          await new Promise((resolve) => {
            // Success
            run.on("exit", function () {
              resolve(true);
            });
          })
        );
      } else {
        // Run the script
        const run = spawn(script, {
          stdio: "pipe",
          cwd: depPath,
          shell: true,
        });

        // Handle errors from the script
        run.on("error", function (err: any) {
          throw err;
        });

        return Promise.resolve(
          await new Promise((resolve) => {
            // Success
            run.on("exit", function () {
              resolve(true);
            });
          })
        );
      }
    })
  );
}
