import glob from "glob";
import rpjf from "read-package-json-fast";
import { getDeps } from "./getDeps.js";

export async function getDepsWorkspaces(globs: string[]) {
  if (!globs) return [];

  const pkgs: { name: string; version: string }[] = [];
  const localDeps: { name: string; path: string }[] = [];

  await Promise.all(
    globs.map(async (pattern) => {
      const files = glob.sync(`${pattern}/package.json`);
      for await (const file of files) {
        const pkg = await rpjf(file);
        const packageName = pkg.name;
        // Save the package name with its file path
        localDeps.push({
          name: packageName,
          // Remove "package.json" from the path
          path: file.substring(0, file.length - "package.json".length),
        });
        const deps = getDeps(pkg);
        pkgs.push(...deps);
      }
    })
  );

  // Replace version with the path if the package is local (starts with "file:")
  return pkgs.map((pkg) => {
    const localDep = localDeps.find((dep) => dep.name === pkg.name);
    if (localDep) {
      pkg.version = `file:${process.cwd()}/${localDep.path}`;
    }
    return pkg;
  });
}
