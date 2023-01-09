import path from "path";
import semver from "semver";

export interface PackageDirectoryMap {
  [key: string]: string;
}

export function getPackageDir(
  name: string,
  version: string,
  parent: string[] = ["node_modules"],
  directories: PackageDirectoryMap
): string | null {
  let packageDir = path.join("node_modules", name);

  // Check if packageDir is already in use by another version
  if (packageDir in directories) {
    // If the existing version satisfies the version being installed, return null
    if (semver.satisfies(directories[packageDir], version)) {
      return null;
    }
  } else {
    // If the packageDir is not in use, check if it exists
    directories[packageDir] = version;
    return packageDir;
  }

  // If packageDir is not in use, try using the parent directories, add "node_modules" between each parent
  packageDir = path.join(...parent, "node_modules", name);

  // Check if packageDir is already in use by another version
  if (packageDir in directories) {
    // If the existing version satisfies the version being installed, return null
    if (semver.satisfies(directories[packageDir], version)) {
      return null;
    }
  }

  // Add the package directory to the map
  directories[packageDir] = version;

  return packageDir;
}
