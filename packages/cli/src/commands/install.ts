import path from "path";
import os from "os";
import chalk from "chalk";
import ora from "ora";
import { mkdtemp, rm } from "fs/promises";
import type { NPM_Info } from "../types/npm-info";
import { downloadPackage } from "../utils/downloadPackage.js";

let depsArray: { name: string; tarball: string }[] = [];

export async function install(packages: string[]) {
  /* console.log(chalk.green(`Installing packages: ${packages.join(", ")}...`)); */
  const loadingPackages = ora(
    chalk.green(`Installing packages: ${packages.join(", ")}...`)
  ).start();

  // Fetch packages from npm registry
  const promises = packages.map(fetchPackage);
  const results = await Promise.all(promises);

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "fpm-"));

  loadingPackages.succeed();

  const fetchingPackages = ora(chalk.green("Fetching packages...")).start();

  // Asyncronus Get all dependencies for each package
  await Promise.all(
    results.map(async (result) => {
      await getAllDependencies(result?.name as string);
    })
  );

  fetchingPackages.text = chalk.green("All packages fetched!");
  fetchingPackages.succeed();

  // Remove duplicates from depsArray
  const depsArrayNoDuplicates = depsArray.filter(
    (dep, index) => depsArray.findIndex((d) => d.name === dep.name) === index
  );

  depsArray = depsArrayNoDuplicates;

  const downloadingPackages = ora(
    chalk.green("Downloading packages...")
  ).start();

  // Download tarballs for each package inside test_packages folder
  Promise.all(
    depsArray.map(async (dep) => {
      await downloadPackage(dep.tarball, dep.name, tmpDir);
      downloadingPackages.text = chalk.green(`${dep.name} installed...`);
    })
  )
    .then(async () => {
      // Remove tmp folder
      return await rm(tmpDir, { recursive: true });
    })
    .finally(() => {
      downloadingPackages.succeed(
        chalk.green(`${depsArray.length} packages installed!`)
      );
    });
}

async function fetchPackage(name: string): Promise<NPM_Info | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`);
    const body = await response.json();

    return {
      name,
      latest: body["dist-tags"]?.latest || "",
      versions: body?.versions || {},
    };
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getAllDependencies(name: string): Promise<any> {
  // Check if package is already in depsArray
  if (depsArray.some((dep) => dep.name === name)) {
    return null;
  }

  const body = await fetchPackage(name);

  if (!body) {
    return;
  }

  // Convert to array of strings
  const deps = body?.versions[body?.latest]?.dependencies
    ? Object.keys(body?.versions[body?.latest]?.dependencies)
    : [];

  const allDependencies = [...deps];

  depsArray.push({
    name,
    tarball: body?.versions[body?.latest]?.dist?.tarball || "",
  });

  // Clear dependencies that are already in depsArray
  allDependencies.forEach((dependency) => {
    if (depsArray.some((dep) => dep.name === dependency)) {
      allDependencies.splice(allDependencies.indexOf(dependency), 1);
    }
  });

  // If there are dependencies, recursively fetch them
  if (allDependencies.length > 0) {
    const promises = allDependencies.map(
      async (dep) => await getAllDependencies(dep)
    );
    await Promise.all(promises);
    return name;
  } else {
    return name;
  }
}
