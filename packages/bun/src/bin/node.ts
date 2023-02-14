import chalk from 'chalk';
import path from 'path';
import readPackage from '../utils/readPackage.js';
import { __dirname } from '../utils/__dirname.js';
import '../utils/globals.js';
import { getDeps } from '../utils/getDeps.js';
import { copyFile } from 'fs/promises';
import performance from 'perf_hooks';
const milliseconds = performance.performance.now;

async function main() {
  const { version } = readPackage(
    path.join(__dirname, '..', '..', 'package.json'),
  );

  console.log(
    chalk.gray(`[Ultra] v${version} (${milliseconds().toFixed(0)} ms)`),
  );

  const deps = getDeps(readPackage(path.join(process.cwd(), 'package.json')));

  console.log('Found dependencies: ', JSON.stringify(deps, null, 2));

  const start = milliseconds();
  await copyFile(
    path.join(process.cwd(), 'package.json'),
    path.join(process.cwd(), 'package.json.bak'),
  );
  const end = milliseconds();

  console.log(`Copied package.json in ${end - start} milliseconds`);

  const __fetch_start = milliseconds();
  await Promise.all(
    deps.map(async (dep) => {
      const { name, version } = dep;
      // Fetch the package
      return fetch(`https://registry.npmjs.org/${name}/${version}`, {
        headers: {
          Accept:
            'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
        },
      });
    }),
  );

  const __fetch_end = milliseconds();

  // Show the time it took to fetch all the packages in milliseconds
  console.log(
    `Fetched ${deps.length} packages in ${
      __fetch_end - __fetch_start
    } milliseconds`,
  );
}

main();
