import os from "os";
import { mkdir, rm } from "fs/promises";
import path from "path";
import ora from "ora";
import rpjf from "read-package-json-fast";
import glob from "glob";

export async function clear() {
  const cacheFolder = `${os.homedir()}/.snpm-cache`;
  const packageJson = `${process.cwd()}/package.json`;
  const pkg = await rpjf(packageJson);
  const workspaces = pkg.workspaces || null;

  const __clear = ora("Clearing cache...").start();
  await rm(cacheFolder, { recursive: true, force: true });
  __clear.succeed("Cleared cache!");

  await mkdir(cacheFolder, { recursive: true });

  const __modules = ora("Clearing node_modules...").start();
  await rm(path.join(process.cwd(), "node_modules"), {
    recursive: true,
    force: true,
  });
  __modules.succeed("Cleared node_modules!");

  if (workspaces) {
    const __workspaces = ora("Clearing workspaces...").start();
    await Promise.all(
      workspaces.map(async (workspace: string) => {
        const packages = glob.sync(`${workspace}/package.json`);
        await Promise.all(
          packages.map(async (pkg) => {
            await rm(path.join(path.dirname(pkg), "node_modules"), {
              recursive: true,
              force: true,
            });
          })
        );
      })
    );
    __workspaces.succeed("Cleared workspaces!");
  }

  ora("Cleared all packages!").succeed();
}
