import { exec } from 'child_process';
import { performance } from 'perf_hooks';

const tests = [
  {
    name: 'NPM install (no cache / no lockfile)',
    command: 'npm install',
    pre: 'npm cache clean -f && rm -rf node_modules package-lock.json',
  },
  {
    name: 'NPM install (with cache / no lockfile)',
    command: 'npm install',
    pre: 'rm -rf node_modules package-lock.json',
  },
  {
    name: 'NPM install (with cache / with lockfile)',
    command: 'npm install',
    pre: 'rm -rf node_modules/',
  },
  {
    name: 'SNPM install (no cache)',
    command: 'snpm install',
    pre: 'npm cache clean -f && rm -rf node_modules /home/nachoaldama/.snpm-cache',
  },
  {
    name: 'SNPM install (with cache)',
    command: 'snpm install',
    pre: 'rm -rf node_modules',
  },
];

(async () => {
  const results = [];
  // Run the tests not in parallel
  for await (const test of tests) {
    console.log(`Running test: ${test.name}`);

    // Execute the pre command
    await new Promise((resolve, reject) => {
      exec(test.pre, (error, stdout, stderr) => {}).on('exit', (code) => {
        resolve();
      });
    });

    const start = performance.now();
    let end;

    await new Promise((resolve) => {
      exec(test.command, (error, stdout, stderr) => {
        end = performance.now();
        resolve();
      });
    });

    results.push({
      name: test.name,
      time: end - start,
    });
    console.log(`Test ${test.name} finished!`);
  }

  // Sort the results by time
  results.sort((a, b) => a.time - b.time);
  // Print the results parsing the time to seconds
  console.log('------------------------');

  results.forEach((result) => {
    console.log(
      `${result.name} took ${(result.time / 1000).toFixed(2)} seconds`,
    );
  });
})();
