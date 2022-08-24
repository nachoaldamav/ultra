import path from "path";
import os from "os";
import chalk from "chalk";
import ora from "ora";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "fs/promises";
import type { NPM_Info } from "../types/npm-info";
import { downloadPackage } from "../utils/downloadPackage.js";
import glob from "glob";
import { chmodSync, existsSync } from "fs";

let depsArray: { name: string; tarball: string; version: string }[] = [];

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
      await downloadPackage(dep.tarball, dep.name, tmpDir)
        .then(() => {
          downloadingPackages.text = chalk.green(`${dep.name} installed...`);
        })
        .catch((error) => {
          ora(
            chalk.red(
              `Error downloading ${dep.name}: ${JSON.stringify(dep, null, 0)}`
            )
          ).fail();
          console.log(error);
        });
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
          const dep = depsArray.find((d) => d.name === p);
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
      // Remove tmp folder
      return await rm(tmpDir, { recursive: true });
    })
    .then(async () => {
      ora(chalk.green("Adding binaries...")).info();
      // Get all package.json files inside cwd/node_modules

      await mkdir(path.join(process.cwd(), "node_modules", ".bin"), {
        recursive: true,
      });

      const packageJSONFiles = glob.sync("**/package.json");
      const promises = packageJSONFiles.map(async (file) => {
        try {
          const packageJSON = await readFile(file, "utf8");
          const packageJSONObject = JSON.parse(packageJSON);
          const { bin } = packageJSONObject;
          if (bin) {
            const isObject = typeof bin === "object";
            const isString = typeof bin === "string";

            if (isObject) {
              Object.keys(bin).forEach(async (key) => {
                // Save binary in cwd/node_modules/package/bin/key
                const binPath = bin[key];
                ora(
                  chalk.blue(
                    `Adding binary ${key} from ${path.join(
                      path.dirname(file),
                      binPath
                    )} to ${path.join(
                      process.cwd(),
                      "node_modules",
                      ".bin",
                      key
                    )}`
                  )
                ).info();

                const binFile = await readFile(
                  path.join(path.dirname(file), binPath),
                  "utf8"
                );

                await writeFile(
                  path.join(process.cwd(), "node_modules", ".bin", key),
                  binFile,
                  "utf8"
                );

                // Change permissions of binary
                chmodSync(
                  path.join(process.cwd(), "node_modules", ".bin", key),
                  0o755
                );

                ora(
                  chalk.green(
                    `Binary ${key} added to ${path.join(
                      process.cwd(),
                      "node_modules",
                      ".bin",
                      key
                    )}`
                  )
                ).succeed();
              });
            } else if (isString) {
              const binPath = path.join(
                path.dirname(file),
                "node_modules",
                packageJSONObject.name,
                "bin",
                bin
              );
              const binFile = path.join(binPath, bin);
              const binFileExists = existsSync(binFile);
              if (binFileExists) {
                chmodSync(binFile, 0o755);
              }
            }
          }
        } catch (error) {
          ora(chalk.red(`Error adding bin to ${file}: ${error}`)).fail();
        }
      });

      return await Promise.all(promises);
    })
    .finally(() => {
      downloadingPackages.succeed(
        chalk.green(`${depsArray.length} packages installed!`)
      );
    });
}

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

async function fetchPackage(name: string): Promise<NPM_Info | null> {
  // If name has version, fetch that version
  if (!name) return null;

  const pkgData = getVersion(name);
  const url = `https://registry.npmjs.org/${pkgData.name}`;

  try {
    const response = await fetch(url);
    const body = await response.json();

    const version =
      (pkgData.version === "latest"
        ? body["dist-tags"]?.latest
        : pkgData.version) || body["dist-tags"]?.latest;

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

  const data = {
    name,
    tarball: body?.versions[body?.latest]?.dist?.tarball || "",
    version: body?.latest || "",
  };

  if (body.latest === undefined) {
    ora(
      chalk.red(`Error fetching ${name}: ${JSON.stringify(body, null, 0)}`)
    ).fail();
  }

  depsArray.push(data);

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
