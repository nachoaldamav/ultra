import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import glob from 'glob';
import { existsSync } from 'node:fs';

async function computeMetaHash(folder, inputHash = null) {
  const hash = inputHash ? inputHash : createHash('sha256');
  const info = await readdir(folder, { withFileTypes: true });
  // construct a string from the modification date, the filename and the filesize
  for (let item of info) {
    const fullPath = path.join(folder, item.name);
    if (item.isFile()) {
      const statInfo = await stat(fullPath);
      // compute hash string name:size:mtime
      const fileInfo = `${fullPath}:${statInfo.size}:${statInfo.mtimeMs}`;
      hash.update(fileInfo);
    } else if (item.isDirectory()) {
      // recursively walk sub-folders
      await computeMetaHash(fullPath, hash);
    }
  }
  // if not being called recursively, get the digest and return it as the hash result
  if (!inputHash) {
    return hash.digest();
  }
}

async function updateVersion() {
  // get all "package.json" files inside the "packages" subfolders
  const packageJsonFiles = glob.sync('packages/**/package.json', {
    cwd: process.cwd(),
    // ignore node_modules
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/**',
      '**/src/**',
      '**/eslint-config-custom/**',
      '**/tsconfig/**',
      '**/types/**',
    ],
  });
  // for each package.json file, update the version
  for (const packageJsonFile of packageJsonFiles) {
    const packageJson = JSON.parse(await readFile(packageJsonFile, 'utf8'));
    const hash = await computeMetaHash(
      path.join(process.cwd(), path.dirname(packageJsonFile), 'src')
    );
    // Convert the hash to a trimmed hex string
    const hashString = hash.toString('hex').slice(0, 8);

    // Update the version
    packageJson.version = `${packageJson.version}-next-${hashString}`;

    console.log(
      `Updated version for ${packageJson.name}: ${packageJson.version}`
    );

    await writeFile(
      path.join(process.cwd(), packageJsonFile),
      JSON.stringify(packageJson, null, 2)
    );
  }
}

updateVersion();
