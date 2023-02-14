import glob from 'glob';
import ora from 'ora';
import path from 'path';
import { getDeps } from './getDeps.js';
import readPackage from './readPackage.js';

type Return = {
  deps: {
    name: string;
    version: string;
    parent?: string | undefined;
  }[];
  pkgs: {
    name: string;
    version: string;
  }[];
};

export async function getDepsWorkspaces(
  globs: string[],
): Promise<Return | null> {
  if (!globs) return null;

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
          path: file.substring(0, file.length - 'package.json'.length),
        });

        const deps = getDeps(pkg).map((dep) => {
          return {
            name: dep.name,
            version: dep.version,
            parent: path.join(
              process.cwd(),
              file.substring(0, file.length - 'package.json'.length),
            ),
          };
        });

        pkgs.push(...deps);
      }
    }),
  );

  ora(JSON.stringify(pkgs, null, 2));

  // Replace version with the path if the package is local (starts with "file:")
  return {
    deps: pkgs.map((pkg) => {
      const localDep = localDeps.find((dep) => dep.name === pkg.name);
      // If package version is * find package in local deps and replace version with the path
      if (localDep) {
        pkg.version = `file:${process.cwd()}/${localDep.path}`;
      }

      return pkg;
    }),
    pkgs: localDeps.map((pkg) => {
      return {
        name: pkg.name,
        version: path.join(process.cwd(), pkg.path),
      };
    }),
  };
}
