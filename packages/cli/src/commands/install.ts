import path from "path";
import chalk from "chalk";
import ora from "ora";
import { mkdtemp, readFile, writeFile, rm } from "fs/promises";
import { downloadPackage } from "../utils/downloadPackage.js";
import { clearName } from "../utils/clearName.js";
import { fetchPackage } from "../utils/fetchPackage.js";
import { compareSemanticVersions } from "../utils/sortVersions.js";
import { existsSync, write } from "fs";
import Arborist from "@npmcli/arborist";

const options = {
  registry: "https://snpm-edge.snpm.workers.dev/package/",
};

const arb = new Arborist(options);

export let depsArray: {
  name: string;
  tarball: string;
  version: string;
  parent?: string;
  parentVersion?: string;
  isPackage?: boolean;
}[] = [];

export async function install(packages: string[]) {
  const spinner = ora("Generating tree...").start();

  await arb.buildIdealTree({
    add: packages,
  });

  const childrens = Array.from(arb.idealTree.children);

  const pkgs = childrens.map((data) => {
    const [name, children] = data as [string, any];
    return {
      name: name,
      version: children.version,
      location: children.location,
      path: children.path,
      resolved: children.resolved,
      children: Array.from(children.edgesOut),
      parents: Array.from(children.edgesIn),
    };
  });

  await writeFile(
    path.join(process.cwd(), "tree.json"),
    JSON.stringify(pkgs, null, 0)
  );

  spinner.succeed();

  const spinner2 = ora("Downloading packages...").start();
  await arb
    .reify({
      save: true,
    })
    .then(() => {
      spinner2.text = "Packages downloaded!";
      spinner2.succeed();
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
