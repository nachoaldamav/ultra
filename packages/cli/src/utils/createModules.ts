import { existsSync } from "fs";
import { mkdir } from "fs/promises";

export async function createModules() {
  // Create node_modules folder if it doesn't exist
  if (
    !existsSync(`${process.cwd()}/node_modules`) ||
    !existsSync(`${process.cwd()}/node_modules/.bin`)
  ) {
    await mkdir(`${process.cwd()}/node_modules/.bin`, { recursive: true });
    return;
  }
}
