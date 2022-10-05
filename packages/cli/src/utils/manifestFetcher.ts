import os from "os";
import path from "path";
import pacote from "pacote";
import { mkdir } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import readConfig from "./readConfig.js";

const cacheFolder = path.join(os.homedir(), ".ultra", "__manifests__");

const token = readConfig().token;

const specialChars = ["^", "~", ">", "<", "=", "|", "&", "*"];

export default async function manifestFetcher(spec: string, props: any) {
  const cacheFile = path.join(cacheFolder, `${spec}.json`);
  const now = Date.now();
  try {
    await mkdir(cacheFolder, { recursive: true }).catch((e) => {});

    const isExact = !specialChars.some((char) => spec.includes(char));

    // Check if cache file exists
    const cacheExists = readFileSync(cacheFile, "utf-8");

    if (cacheExists) {
      const cache = JSON.parse(cacheExists);

      // Check if cache is expired
      if (cache.expires > now || isExact) {
        return cache.manifest;
      }
    }

    // Fetch manifest
    const manifest = await pacote.manifest(spec, {
      ...props,
      _authToken: token ? token : null,
    });

    mkdirSync(path.dirname(cacheFile), { recursive: true });

    // Save manifest to cache
    writeFileSync(
      cacheFile,
      JSON.stringify({
        manifest,
        // Add 5 minutes to cache
        expires: now + 300000,
      }),
      "utf-8"
    );

    return manifest;
  } catch (e) {
    const manifest = await pacote.manifest(spec, {
      ...props,
      _authToken: token ? token : null,
    });

    mkdirSync(path.dirname(cacheFile), { recursive: true });

    // Save manifest to cache
    writeFileSync(
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
}
