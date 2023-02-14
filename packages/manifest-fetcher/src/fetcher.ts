import os from 'node:os';
import path from 'node:path';
import pacote from 'pacote';
import { mkdir } from 'node:fs/promises';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readConfig } from '@ultrapkg/read-config';
import { readNpmConfig } from '@ultrapkg/npm-config';
import { UltraError } from '@ultrapkg/error-logger';

const cacheFolder = path.join(os.homedir(), '.ultra', '__manifests__');

const token = readConfig().token;
const registry = readConfig().registry || 'https://registry.npmjs.org';
const npmrc = readNpmConfig();

const specialChars = ['^', '~', '>', '<', '=', '|', '&', '*'];

/**
 * Fetches a manifest from the registry using pacote
 * and caches it for 5 minutes.
 * @param spec The package spec, e.g. "react@latest"
 * @param props Additional pacote options
 * @returns The manifest as a JSON object
 * @example
 * const manifest = await manifestFetcher("react@latest");
 **/
export async function manifestFetcher(spec: string, props?: any) {
  // Remove spaces "|", ">" and "<" from the spec
  const sanitizedSpec = spec
    .replace(/\|/g, '7C')
    .replace(/>/g, '3E')
    .replace(/</g, '3C');

  const cacheFile = path.join(cacheFolder, `${sanitizedSpec}.json`);
  const now = Date.now();
  try {
    await mkdir(cacheFolder, { recursive: true }).catch((e) => {});

    const isExact = !specialChars.some(
      (char) =>
        sanitizedSpec.includes(char) || sanitizedSpec.includes('latest'),
    );

    // Check if cache file exists
    const cacheExists = readFileSync(cacheFile, 'utf-8');

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
        'keep-alive': 'timeout=5, max=1000',
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
      'utf-8',
    );

    return manifest;
  } catch (e) {
    // Fetch manifest
    const manifest = await pacote
      .manifest(spec, {
        ...props,
        registry,
        token,
        ...npmrc,
        headers: {
          'keep-alive': 'timeout=5, max=1000',
        },
      })
      .catch((e) => {
        return new UltraError(
          'ERR_ULTRA_MANIFEST_FETCHER',
          e.message,
          '@ultrapkg/manifest-fetcher',
        );
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
      'utf-8',
    );

    return manifest;
  }
}
