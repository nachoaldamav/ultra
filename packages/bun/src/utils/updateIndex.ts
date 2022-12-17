import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export async function updateIndex(name: string, version: string) {
  await mkdir(path.join(userUltraCache, name), { recursive: true });
  const indexFile = path.join(userUltraCache, name, "index.json");
  const indexFileExists = existsSync(indexFile);

  if (!indexFileExists) {
    writeFileSync(indexFile, "{}");
  }

  const index = JSON.parse(readFileSync(indexFile, "utf-8"));

  (index[version] = path.join(userUltraCache, name, version)),
    writeFileSync(indexFile, JSON.stringify(index, null, 2));
}
