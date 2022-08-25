import chalk from "chalk";
import ora from "ora";
import type { NPM_Info } from "../../types/npm-info";
import { getNearestVersion } from "../utils/getNearestVersion.js";

function getVersion(name: string) {
  const version = name.split("@");

  if (name.startsWith("@")) {
    if (version.length === 2) {
      return {
        name: "@" + version[1],
        version: "latest",
      };
    } else {
      return {
        name: "@" + version[1],
        version: version[2],
      };
    }
  } else if (version.length === 2) {
    return {
      name: version[0],
      version: version[1],
    };
  } else {
    return {
      name: version[0],
      version: "latest",
    };
  }
}

export async function fetchPackage(name: string): Promise<NPM_Info | null> {
  // If name has version, fetch that version
  if (!name) return null;

  const pkgData = getVersion(name);
  const url = `https://registry.npmjs.org/${pkgData.name}`;

  try {
    const response = await fetch(url);
    const body = await response.json();

    const version = getNearestVersion(pkgData.version, body);

    if (!body.versions) {
      ora(chalk.red(`${url} not found`)).fail();
    }

    return {
      name: body.name,
      latest: version || body["dist-tags"].latest,
      versions: body.versions,
    };
  } catch (error) {
    console.log(`Error fetching ${name}:`, error);
    return null;
  }
}
