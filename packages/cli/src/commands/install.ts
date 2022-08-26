import path from "path";
import chalk from "chalk";
import ora from "ora";
import { mkdtemp, readFile, writeFile, rm } from "fs/promises";
import { downloadPackage } from "../utils/downloadPackage.js";
import { clearName } from "../utils/clearName.js";
import { fetchPackage } from "../utils/fetchPackage.js";
import { compareSemanticVersions } from "../utils/sortVersions.js";
import { existsSync } from "fs";
import Arborist from "@npmcli/arborist";

const arb = new Arborist();

export let depsArray: {
  name: string;
  tarball: string;
  version: string;
  parent?: string;
  parentVersion?: string;
  isPackage?: boolean;
}[] = [];

export async function install(packages: string[]) {
  const loadingPackages = ora(
    chalk.green(`Installing packages: ${packages.join(", ")}...`)
  ).start();

  const isLocalInstall = packages.length === 0;

  // Remove node_modules/.bin folder if it exists
  const binPath = path.join(process.cwd(), "node_modules", ".bin");
  if (existsSync(binPath)) {
    await rm(binPath, { recursive: true });
  }

  // If no packages are passed, install dependencies from package.json
  if (packages.length === 0) {
    const packageJSON = await readFile(
      path.join(process.cwd(), "package.json"),
      "utf8"
    );

    const packageJSONObject = JSON.parse(packageJSON);
    const dependencies = packageJSONObject.dependencies;
    const devDependencies = packageJSONObject?.devDependencies || {};

    // Create array of dependencies to install with name and version
    const allDependencies = [
      ...Object.keys(dependencies).map((key) => `${key}@${dependencies[key]}`),
      ...Object.keys(devDependencies).map(
        (key) => `${key}@${devDependencies[key]}`
      ),
    ];

    // Sort deps by alphabetical order
    packages = allDependencies.sort();
  }

  ora(
    chalk.blue(`Fetching dependencies..., ${JSON.stringify(packages, null, 0)}`)
  ).info();

  loadingPackages.succeed();

  const fetchingPackages = ora(chalk.green("Fetching packages...")).start();

  // Fetch packages from npm registry
  const promises = packages.map((packageName) =>
    getAllDependencies(packageName)
  );

  await Promise.all(promises);

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

  // Remove duplicates from depsArray by name, version, parent and parentVersion
  const depsArrayNoDuplicates = depsArray.filter(
    (dep, index) =>
      depsArray.findIndex(
        (dep2) =>
          dep.name === dep2.name &&
          dep.version === dep2.version &&
          dep.parent === dep2.parent &&
          dep.parentVersion === dep2.parentVersion
      ) === index
  );

  const downloadingPackages = ora(
    chalk.green("Downloading packages...")
  ).start();

  // Download tarballs for each package
  Promise.all(
    depsArrayNoDuplicates.map(async (dep) => {
      // Get all dependencies with the same name
      const deps = depsArrayNoDuplicates.filter((d) => d.name === dep.name);

      // Get dep that doesn't have a parent
      const isLocal = deps.find((d) => d.parent === "");

      // If no parent, download package to root
      if (isLocal && isLocal === dep) {
        await downloadPackage(dep.tarball, dep.name);
        return;
      }

      // Find deps with same parent, but different version
      const sameParent = deps.filter((d) => d.parent === dep.parent);
      const sameParentDifferentVersion = sameParent.filter(
        (d) => d.parentVersion !== dep.parentVersion
      );

      if (sameParentDifferentVersion.length > 1) {
        // If there are deps with same parent, but different version, download package to parent
        ora(
          chalk.blue(
            `${dep.name}@${dep.version} has ${
              sameParentDifferentVersion.length
            } other versions of ${
              dep.parent
            } with versions ${sameParentDifferentVersion
              .map((d) => d.parentVersion)
              .join(", ")}`
          )
        ).info();
      }

      // If there is more than one version of a package, send latest version to root, otherwise send version to parent folder
      const packageArray = [...new Set(deps)];

      if (packageArray.length === 1) {
        await downloadPackage(dep.tarball, dep.name, null);
      } else if (packageArray.length > 1) {
        const sortedVersions = packageArray.sort(compareSemanticVersions);
        const latestVersion = sortedVersions[sortedVersions.length - 1];
        const isLatestVersion = dep.version === latestVersion.version;

        await downloadPackage(
          dep.tarball,
          dep.name,
          isLatestVersion && !isLocal ? null : dep.parent
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
    .finally(async () => {
      downloadingPackages.succeed(
        chalk.green(`${depsArray.length} packages installed!`)
      );
    });
}

async function getAllDependencies(
  name: string,
  parent?: string,
  parentVersion?: string
): Promise<any> {
  // Check if package is already in depsArray by name and version
  if (depsArray.find((d) => d.name === name && !parent)) {
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
    parentVersion: parentVersion || "",
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
        await getAllDependencies(
          `${dep.name}@${dep.version}`,
          name,
          body.latest
        )
    );
    await Promise.all(promises);
    return name;
  } else {
    return name;
  }
}
