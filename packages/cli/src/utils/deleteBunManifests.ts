import { unlinkSync } from "fs";
import os from "os";
import path from "path";
import glob from "glob";

export default async function deleteBunManifests() {
  const homeDir = os.homedir();
  const bunDir = path.join(homeDir, ".bun", "install", "cache");

  // Find all file with .npm extension
  const files = glob.sync("**/*.npm", {
    cwd: bunDir,
  });

  // Delete all files
  files.forEach((file: string) => {
    unlinkSync(path.join(bunDir, file));
  });

  return;
}
