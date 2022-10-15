import chalk from "chalk";
import { spawn } from "child_process";
import { performance } from "perf_hooks";
import ora from "ora";
import parseTime from "../utils/parseTime.js";

export async function test(args: string[]) {
  const typeArg =
    args.find((arg) => arg.startsWith("--type=")) || "--type=clean";
  const runsArg = args.find((arg) => arg.startsWith("--runs=")) || "--runs=1";
  const buildArg =
    args.find((arg) => arg.startsWith("--build=")) || "--build=build";

  const type = typeArg.split("=")[1];
  const runs = parseInt(runsArg.split("=")[1], 10);
  const build = buildArg.split("=")[1];

  let params;

  if (type === "clean") {
    params = `ultra clear && ultra i && ultra run ${build}`;
  } else if (type === "no-lock") {
    params = `rm -rf node_modules ultra.lock && ultra i && ultra run ${build}`;
  } else if (type === "cached") {
    params = `ultra i && ultra run ${build}`;
  } else {
    ora(
      chalk.red(
        `Invalid type argument. Expected one of "clean", "no-lock", "cached".`
      )
    ).fail();
    process.exit(1);
  }

  const results: {
    success: boolean;
    time: number;
  }[] = [];

  for (let i = 0; i < runs; i++) {
    const spinner = ora(`Running ${type} test`).start();
    const child = spawn(params, {
      shell: true,
      stdio: "pipe",
    });

    const now = performance.now();

    spinner.prefixText = chalk.grey(`[${i + 1}/${runs}]`);

    // Show last line in spinner.text
    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      spinner.text = chalk.green(lines[lines.length - 2]);
    });

    await new Promise((resolve) => {
      child.on("close", (code) => {
        if (code === 0) {
          spinner.text = chalk.green(
            `Completed in ${parseTime(performance.now(), now)}`
          );
          spinner.succeed();
          results.push({
            success: true,
            time: performance.now() - now,
          });
          resolve(true);
        } else {
          spinner.text = chalk.red(
            `Completed in ${parseTime(performance.now(), now)}`
          );
          spinner.fail();
          results.push({
            success: false,
            time: performance.now() - now,
          });
          resolve(false);
        }
      });
    });
  }

  const success = results.filter((r) => r.success).length;
  const fail = results.filter((r) => !r.success).length;

  console.log(
    `
✅ ${chalk.green(`Success: ${success}`)}
❌ ${chalk.red(`Fail: ${fail}`)}
`
  );
}
