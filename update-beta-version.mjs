import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

async function computeMetaHash(folder, inputHash = null) {
  const hash = inputHash ? inputHash : createHash("sha256");
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
  const packageJson = JSON.parse(
    await readFile(
      path.join(process.cwd(), "packages", "cli", "package.json"),
      "utf8"
    )
  );
  const hash = await computeMetaHash(
    path.join(process.cwd(), "packages", "cli", "src")
  );
  // Convert the hash to a hex string
  const hashString = hash.toString("hex");
  // Update the version
  packageJson.version = `${packageJson.version}-next-${hashString}`;

  console.log(`${packageJson.version}`);

  await writeFile(
    path.join(process.cwd(), "packages", "cli", "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

updateVersion();
