import path from "node:path";
import semver from "semver";
import { readPackage } from "@ultrapkg/read-package";
import { getDeps } from "@ultrapkg/get-deps";

export default function checkLock(lock: any) {
  const pkg = readPackage(path.join(process.cwd(), "package.json"));
  const deps = getDeps(pkg);

  for (const dep of deps) {
    if (!lock[dep.name])
      throw new Error(`Package ${dep.name} not found in lock file`);
    let results = [];
    for (const version of Object.keys(lock[dep.name])) {
      // If no version satisfies the version of the pkg, throw error
      if (semver.satisfies(version, dep.version) || version === dep.version) {
        results.push(version);
      } else if (version === "local") {
        results.push(version);
      }
    }
    if (results.length === 0)
      throw new Error(
        `No version of ${dep.name} satisfies the version ${dep.version} in package.json`
      );
  }

  return true;
}
