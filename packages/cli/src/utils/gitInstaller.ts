import chalk from "chalk";
import ora, { Ora } from "ora";
import { execa } from "execa";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { hardLinkSync } from "./hardLinkSync.js";

export async function gitInstall(
  manifest: any,
  parent?: string,
  spinner?: Ora
) {
  const regex =
    /(?<protocol>git\+ssh:\/\/git@|git\+https:\/\/git@|git:\/\/|github:)(?<domain>github\.com\/|github\.com:)(?<owner>[^\/]+)\/(?<repo>[^#]+)(#(?<commit>[^#]+))?/;
  const match = manifest.version.match(regex);

  if (!match && !manifest.version.startsWith("github:")) {
    throw new Error(
      `Invalid git uri for ${manifest.name}: ${manifest.version}`
    );
  }

  const domain = match?.groups?.domain || "github.com/";
  const owner = match?.groups?.owner || manifest.version.slice(7).split("/")[0];
  const repo =
    match?.groups?.repo || manifest.version.split("#")[0].split("/")[1];
  const commit =
    match?.groups?.commit || manifest.version.split("#")[1] || "main";

  const url = createUrl(domain, owner, repo);

  const targetPath = join(userUltraCache, "git", owner, repo, commit);

  if (spinner) {
    spinner.text = chalk.green(`Cloning ${chalk.cyan(url)}...`);
  }

  if (!existsSync(targetPath)) {
    await execa("git", ["clone", "-n", url, targetPath], {
      stdio: "pipe",
    });
    await execa("git", ["pull"], {
      cwd: targetPath,
      stdio: "pipe",
    });
    await execa("git", ["checkout", commit], {
      cwd: targetPath,
      stdio: "pipe",
    });
  } else {
    await execa("git", ["pull"], {
      cwd: targetPath,
      stdio: "pipe",
    });
  }

  const nmPath = join(process.cwd(), "node_modules", manifest.name);

  hardLinkSync(targetPath, nmPath);
}

function createUrl(domain: string, owner: string, repo: string) {
  return `https://${domain}${owner}/${repo}/`;
}
