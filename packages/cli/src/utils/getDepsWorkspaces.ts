import glob from "glob";
import path from "path";
import { getDeps } from "./getDeps.js";
import readPackage from "./readPackage.js";

export async function getDepsWorkspaces(globs: string[]) {
  if (!globs) return [];

  const pkgs: { name: string; version: string; parent?: string }[] = [];
  const localDeps: { name: string; path: string }[] = [];

  await Promise.all(
    globs.map(async (pattern) => {
      const files = glob.sync(`${pattern}/package.json`);
      for await (const file of files) {
        const pkg = readPackage(file);
        const packageName = pkg.name;
        // Save the package name with its file path if package is not private
        localDeps.push({
          name: packageName,
          // Remove "package.json" from the path
          path: file.substring(0, file.length - "package.json".length),
        });

        const deps = getDeps(pkg).map((dep) => {
          return {
            name: dep.name,
            version: dep.version,
            parent: path.join(
              process.cwd(),
              file.substring(0, file.length - "package.json".length)
            ),
          };
        });

        pkgs.push(...deps);
      }
    })
  );

  // Replace version with the path if the package is local (starts with "file:")
  return pkgs.map((pkg) => {
    const localDep = localDeps.find((dep) => dep.name === pkg.name);
    // If package version is * find package in local deps and replace version with the path
    if (localDep) {
      pkg.version = `file:${process.cwd()}/${localDep.path}`;
    } else if (pkg.version.includes("*")) {
      // Find package in local deps and replace version with the path
      const localDep = localDeps.find((dep) => dep.name === pkg.name);
      if (localDep) {
        pkg.version = `file:${process.cwd()}/${localDep.path}`;
      }
    }

    return pkg;
  });
}
