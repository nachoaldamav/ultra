import os from "os";
import { mkdir, rm } from "fs/promises";

export async function clear() {
  const cacheFolder = `${os.homedir()}/.snpm-cache`;
  // Remove cache folder
  await rm(cacheFolder, { recursive: true });
  // Create cache folder
  await mkdir(cacheFolder, { recursive: true });
}
