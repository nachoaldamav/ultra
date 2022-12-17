import path from "path";
import { execa } from "execa";
import ora from "ora";
import chalk from "chalk";
import { readPackage } from "@ultrapkg/read-package";

export default async function basePostInstall() {
  const pkg = readPackage(path.join(process.cwd(), "package.json"));

  if (pkg.scripts && pkg.scripts.postinstall) {
    await execa("ultra", ["run", "postinstall"], {
      stdio: "inherit",
    }).catch((err) => {
      ora(chalk.red("Error running postinstall script")).fail();
      process.exit(1);
    });

    return;
  }

  return;
}
