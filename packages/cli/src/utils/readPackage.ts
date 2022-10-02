import { readFileSync } from "node:fs";

export default function readPackage(path: string) {
  try {
    const pkg = JSON.parse(readFileSync(path, "utf8"));
    if (pkg.bundledDependencies) {
      pkg.bundleDependencies = pkg.bundledDependencies;
      delete pkg.bundledDependencies;
    }
    if (typeof pkg.bin === "string") {
      pkg.bin = { [pkg.name]: pkg.bin };
    }
    return pkg;
  } catch (err) {
    throw new Error(`Error reading package.json from ${path}`);
  }
}
