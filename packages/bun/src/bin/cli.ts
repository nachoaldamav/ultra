import chalk from "chalk";
import path from "path";
import readPackage from "../utils/readPackage.js";
import { __dirname } from "../utils/__dirname.js";
import "../utils/globals.js";
import { getDeps } from "../utils/getDeps.js";
import { copyFile } from "fs/promises";
import { nanoseconds } from "bun";
import manifestFetcher from "../utils/bun/manifestFetcher.js";
import { ultraExtract } from "../utils/extract.js";

async function main() {
  const { version } = readPackage(
    path.join(__dirname, "..", "..", "package.json")
  );

  console.log(
    chalk.gray(
      `[Ultra] v${version} (${(nanoseconds() / 1000000).toFixed(0)} ms)`
    )
  );

  const deps = getDeps(readPackage(path.join(process.cwd(), "package.json")));

  const start = nanoseconds();
  await copyFile(
    path.join(process.cwd(), "package.json"),
    path.join(process.cwd(), "package.json.bak")
  );
  const end = nanoseconds();

  console.log(`Copied package.json in ${(end - start) / 1000000} milliseconds`);

  const __fetch_start = nanoseconds();
  await Promise.all(
    deps.map(async (dep) => {
      const { name, version } = dep;
      // Fetch the package
      const manifest = await manifestFetcher(`${name}@${version}`);
      // Get the tarball url
      const tarball = manifest.dist.tarball;
      // Download the tarball
      const status = await ultraExtract(
        `${path.join(process.cwd(), "node_modules")}/${name}`,
        tarball,
        manifest.dist.integrity,
        name
      );
    })
  );
  const __fetch_end = nanoseconds();

  // Show the time it took to fetch all the packages in milliseconds
  console.log(
    `Fetched ${deps.length} packages in ${
      (__fetch_end - __fetch_start) / 1000000
    } milliseconds`
  );
}

main();
