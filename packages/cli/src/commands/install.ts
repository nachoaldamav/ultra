import path from "path";
import os from "os";
import chalk from "chalk";
import ora from "ora";
import { mkdtemp, readFile, writeFile } from "fs/promises";
import { downloadPackage } from "../utils/downloadPackage.js";
import { clearName } from "../utils/clearName.js";
import { fetchPackage } from "../utils/fetchPackage.js";
import { compareSemanticVersions } from "../utils/sortVersions.js";

let depsArray: {
  name: string;
  tarball: string;
  version: string;
  parent: string;
}[] = [];

export async function install(packages: string[]) {
  const loadingPackages = ora(
    chalk.green(`Installing packages: ${packages.join(", ")}...`)
  ).start();

  const isLocalInstall = packages.length === 0;

  // If no packages are passed, install dependencies from package.json
  if (packages.length === 0) {
    const packageJSON = await readFile(
      path.join(process.cwd(), "package.json"),
      "utf8"
    );

    const packageJSONObject = JSON.parse(packageJSON);
    const dependencies = packageJSONObject.dependencies;
    const devDependencies = packageJSONObject?.devDependencies || {};
    const allDependencies = [
      ...Object.keys(dependencies),
      ...Object.keys(devDependencies),
    ];
    packages = allDependencies;
  }

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

  // Write depsArray to file
  const writingPackages = ora(chalk.green("Writing packages...")).start();
  const depsArrayString = JSON.stringify(depsArray, null, 2);
  await writeFile(
    path.join(path.join(process.cwd(), "depsArray.json")),
    depsArrayString
  );
  writingPackages.succeed();

  // Remove duplicates from depsArray by name and version
  const depsArrayNoDuplicates = depsArray.filter(
    (dep, index) =>
      depsArray.findIndex(
        (d) => d.name === dep.name && d.version === dep.version
      ) === index
  );

  const downloadingPackages = ora(
    chalk.green("Downloading packages...")
  ).start();

  // Download tarballs for each package inside test_packages folder
  Promise.all(
    depsArrayNoDuplicates.map(async (dep) => {
      // If there is more than one version of a package, send latest version to root, otherwise send version to parent folder
      const packageArray = depsArrayNoDuplicates.filter(
        (d) => d.name === dep.name
      );

      if (packageArray.length > 1) {
        const sortedVersions = packageArray.sort(compareSemanticVersions);
        const latestVersion = sortedVersions[sortedVersions.length - 1];
        const isLatestVersion = dep.version === latestVersion.version;

        await downloadPackage(
          dep.tarball,
          dep.name,
          isLatestVersion ? "" : dep.parent
        ).then(() => {
          downloadingPackages.text = chalk.green(`${dep.name} installed...`);
        });
      } else {
        await downloadPackage(dep.tarball, dep.name)
          .then(() => {
            downloadingPackages.text = chalk.green(`${dep.name} installed...`);
          })
          .catch((error) => {});
      }
    })
  )
    .then(async () => {
      // Add dependencies to package.json
      const packageJSON = await readFile(
        path.join(process.cwd(), "package.json"),
        "utf8"
      );

      const packageJSONObject = JSON.parse(packageJSON);
      const dependencies = packageJSONObject.dependencies;

      // Add packages to dependencies
      if (!isLocalInstall) {
        packages.forEach((p) => {
          const dep = depsArrayNoDuplicates.find((d) => d.name === p);
          if (dep) {
            dependencies[dep?.name] = dep?.version;
          }
        });

        await writeFile(
          path.join(process.cwd(), "package.json"),
          JSON.stringify(packageJSONObject, null, 2),
          "utf8"
        );
      }
    })
    .finally(() => {
      downloadingPackages.succeed(
        chalk.green(`${depsArray.length} packages installed!`)
      );
    });
}

async function getAllDependencies(name: string, parent?: string): Promise<any> {
  // Check if package is already in depsArray by name and version
  if (depsArray.find((d) => d.name === name && d.version === parent)) {
    return null;
  }

  const body = await fetchPackage(name);

  if (!body) {
    return;
  }

  // Convert to array of objects
  const deps = body?.versions[body?.latest]?.dependencies
    ? Object.keys(body?.versions[body?.latest]?.dependencies).map((key) => ({
        name: key,
        version: body?.versions[body?.latest]?.dependencies[key],
      }))
    : [];

  const allDependencies = [...deps];
  const data = {
    name: clearName(name),
    tarball: body?.versions[body?.latest]?.dist?.tarball || "",
    version: body?.latest || "",
    parent: parent ? clearName(parent) : "",
  };

  if (body.latest === undefined) {
    ora(
      chalk.red(`Error fetching ${name}: ${JSON.stringify(body, null, 0)}`)
    ).fail();
  }

  depsArray.push(data);

  // Clear dependencies that are already in depsArray
  allDependencies.forEach((dependency) => {
    if (depsArray.some((dep) => dep.name === dependency.name)) {
      allDependencies.splice(allDependencies.indexOf(dependency), 1);
    }
  });

  // If there are dependencies, recursively fetch them
  if (allDependencies.length > 0) {
    const promises = allDependencies.map(
      async (dep) =>
        await getAllDependencies(`${dep.name}@${dep.version}`, name)
    );
    await Promise.all(promises);
    return name;
  } else {
    return name;
  }
}
