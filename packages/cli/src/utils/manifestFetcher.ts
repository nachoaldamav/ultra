import os from "os";
import path from "path";
import pacote from "pacote";
import { mkdir } from "node:fs/promises";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import readConfig from "./readConfig.js";
import { readNpmConfig } from "./npmConfig.js";
import ora from "ora";
import chalk from "chalk";

const cacheFolder = path.join(os.homedir(), ".ultra", "__manifests__");

const token = readConfig().token;
const registry = readConfig().registry || "https://registry.npmjs.org";
const npmrc = readNpmConfig();

const specialChars = ["^", "~", ">", "<", "=", "|", "&", "*"];

export default async function manifestFetcher(spec: string, props?: any) {
  // Remove spaces "|", ">" and "<" from the spec
  const sanitizedSpec = spec
    .replace(/\|/g, "7C")
    .replace(/>/g, "3E")
    .replace(/</g, "3C");

  const cacheFile = path.join(cacheFolder, `${sanitizedSpec}.json`);
  const now = Date.now();
  try {
    await mkdir(cacheFolder, { recursive: true }).catch((e) => {});

    const isExact = !specialChars.some(
      (char) => sanitizedSpec.includes(char) || sanitizedSpec.includes("latest")
    );

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
      registry,
      token,
      ...npmrc,
      headers: {
        "keep-alive": "timeout=5, max=1000",
      },
    });

    if (spec.includes("nachoaldamav")) {
      ora(chalk.blueBright(JSON.stringify(manifest))).info();
    }

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
    // Fetch manifest
    const manifest = await pacote.manifest(spec, {
      ...props,
      registry,
      token,
      ...npmrc,
      headers: {
        "keep-alive": "timeout=5, max=1000",
      },
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
