import chalk from "chalk";
import { Ora } from "ora";
import { execa } from "execa";
import { join, dirname } from "path";
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "fs";
import { installPkg } from "./installPkg.js";
import binLinks from "bin-links";
import { linker } from "@ultrapkg/linker";
import { readPackage } from "@ultrapkg/read-package";
import { getDeps } from "@ultrapkg/get-deps";

export async function gitInstall(
  manifest: any,
  parent?: string,
  spinner?: Ora,
  justDownload?: boolean
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
    match?.groups?.repo.replace(".git", "") ||
    manifest.version.split("#")[0].split("/")[1];
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
  } else if (!commit) {
    await execa("git", ["pull"], {
      cwd: targetPath,
      stdio: "pipe",
    });
  }

  writeFileSync(join(targetPath, downloadFile), "{}");

  if (!justDownload) {
    const nmPath = join(process.cwd(), "node_modules", manifest.name);

    await linker(targetPath, nmPath);

    __DOWNLOADED.push({
      name: manifest.name,
      version: manifest.version,
      path: nmPath.replace(process.cwd(), ""),
      cache: targetPath.replace(userUltraCache, ""),
      tarball: url,
    });

    if (manifest.fromMonorepo !== undefined) {
      try {
        // Symlink pkgProjectDir to "fromMonorepo" folder
        mkdirSync(
          dirname(join(manifest.fromMonorepo, "node_modules", manifest.name)),
          {
            recursive: true,
          }
        );
        symlinkSync(
          nmPath,
          join(manifest.fromMonorepo, "node_modules", manifest.name)
        );
      } catch (e) {}
    }

    const pkg = readPackage(join(targetPath, "package.json"));

    const deps = getDeps(pkg, {
      dev: true,
    });

    // Install production deps
    const installed = await Promise.all(
      deps.map(async (dep) => {
        const data = await installPkg(
          {
            name: dep.name,
            version: dep.version,
            optional: dep.optional || false,
          },
          nmPath,
          spinner
        );

        if (!data) return null;

        return {
          name: dep.name,
          version: data.version,
          tarball: data.tarball,
          integrity: data.integrity,
          path: join(userUltraCache, dep.name, data.version),
        };
      })
    );

    // Remove null values
    const filtered = installed.filter((i) => i);

    // Save installed deps with its path in .ultra file as objects
    let object: { [key: string]: any } = {
      "ultra:self": {
        name: manifest.name,
        version: manifest.version,
        tarball: url,
        path: targetPath,
      },
    };

    filtered.forEach((dep) => {
      if (dep)
        object[dep.name] = {
          [dep.version]: {
            path: dep.path,
            tarball: dep.tarball,
            integrity: dep.integrity,
          },
        };
    });

    writeFileSync(
      join(targetPath, downloadFile),
      JSON.stringify(object, null, 2),
      "utf-8"
    );

    // Execute postinstall script if exists
    const postinstall = pkg?.scripts?.postinstall || null;
    if (postinstall) {
      __POSTSCRIPTS.push({
        package: manifest.name,
        scriptPath: nmPath,
        cachePath: targetPath,
        script: postinstall,
      });
    }

    // Symlink bin files
    await binLinks({
      path: nmPath,
      pkg,
      global: false,
      force: true,
    });
  }

  return {
    name: manifest.name,
    version: manifest.version,
    tarball: url,
    spec: manifest.version,
    optional: manifest.optional || false,
    integrity: "",
  };
}

function createUrl(domain: string, owner: string, repo: string) {
  return `https://${domain}${owner}/${repo}/`;
}
