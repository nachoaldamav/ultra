import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export default function getVersions(name: string) {
  const indexFile = path.join(userUltraCache, name, 'index.json');
  const indexFileExists = existsSync(indexFile);

  if (!indexFileExists) {
    return [];
  }

  const index = JSON.parse(readFileSync(indexFile, 'utf-8'));

  return Object.keys(index);
}
