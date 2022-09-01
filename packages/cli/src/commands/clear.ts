import os from "os";
import { mkdir, rm } from "fs/promises";
import path from "path";

export async function clear() {
  const cacheFolder = `${os.homedir()}/.snpm-cache`;
  // Remove cache folder
  await rm(cacheFolder, { recursive: true });
  // Create cache folder
  await mkdir(cacheFolder, { recursive: true });
  // Remove node_modules folder
  await rm(path.join(process.cwd(), "node_modules"), { recursive: true });
}
