import os from "os";
import path from "path";
import pacote from "pacote";
import { readFile, writeFile, mkdir } from "fs/promises";

const cacheFolder = path.join(os.homedir(), ".fnpm", "__manifests__");

const specialChars = ["^", "~", ">", "<", "=", "|", "&", "*"];

export default async function manifestFetcher(spec: string, props: any) {
  await mkdir(cacheFolder, { recursive: true }).catch((e) => {});

  const cacheFile = path.join(cacheFolder, `${spec}.json`);
  const now = Date.now();

  const isExact = !specialChars.some((char) => spec.includes(char));

  // Check if cache file exists
  const cacheExists = await readFile(cacheFile, "utf-8").catch(() => null);

  if (cacheExists) {
    const cache = JSON.parse(cacheExists);

    // Check if cache is expired
    if (cache.expires > now || isExact) {
      return cache.manifest;
    }
  }

  // Fetch manifest
  const manifest = await pacote.manifest(spec, props);

  const dirs = cacheFile.split("/");
  dirs.pop();
  await mkdir(dirs.join("/"), { recursive: true });

  // Save manifest to cache
  await writeFile(
    cacheFile,
    JSON.stringify({
      manifest,
      // Add 5 minutes to cache
      expires: now + 300000,
    }),
    "utf-8"
  );

  return manifest;
}
