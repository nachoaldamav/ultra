import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function lockInstall(pathname: string, cache: string) {
  const hardLinkChild = spawn("node", [
    path.join(__dirname, "hardLinkFork.js"),
    pathname,
    cache,
  ]);

  hardLinkChild.send({
    pathname,
    cache,
  });

  return new Promise((resolve) => {
    hardLinkChild.on("exit", () => {
      resolve(true);
    });
  });
}
