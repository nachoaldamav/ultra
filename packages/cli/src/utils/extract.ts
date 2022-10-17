import tar from "tar";
import {
  createWriteStream,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import axios from "axios";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { readNpmConfig } from "./npmConfig.js";
import readConfig from "./readConfig.js";

const npmrc = readNpmConfig();
const { token, registry } = readConfig();

// Get system temp directory
const tmpDir = os.tmpdir();

const cacheBasePath = path.join(tmpDir, "ultra_tmp");

export async function ultraExtract(
  target: string,
  tarball: string,
  sha: string,
  name: string
): Promise<void | { res: string }> {
  if (!tarball) {
    throw new Error("No tarball provided");
  }

  // Read .ultra file to know if it's fully installed
  const ultraFile = path.join(target, downloadFile);
  const ultraFileExists = existsSync(ultraFile);

  if (ultraFileExists || __DOWNLOADING.includes(tarball)) {
    return {
      res: "skipped",
    };
  }

  __DOWNLOADING.push(tarball);

  let file = path.join(
    cacheBasePath,
    // @ts-ignore-next-line
    tarball.split("/").pop()
  );

  if (!existsSync(cacheBasePath)) {
    mkdirSync(cacheBasePath);
  }

  try {
    if (!existsSync(file)) {
      const org = name.startsWith("@") ? name.split("/")[0] : null;

      const npmRegistry =
        (org ? npmrc[`${org}:registry`] : npmrc.registry) || registry;

      const parseRegistry = npmRegistry
        ? npmRegistry.replace(/https?:\/\//, "")
        : "";

      const npmToken = org
        ? npmrc[`//${parseRegistry}:_authToken`]
        : npmrc._authToken || token;

      const writer = createWriteStream(file);
      const response = await axios({
        url: tarball,
        method: "GET",
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${npmToken}`,
        },
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const fileBuffer = readFileSync(file);
      const hashSum = createHash("sha512");

      hashSum.update(fileBuffer);
      const hash = "sha512-" + hashSum.digest("base64");

      if (hash !== sha) {
        ora().fail(chalk.red(`SHA512 mismatch for ${tarball}`));
        ora().fail(chalk.red(`Expected ${sha} but got ${hash}`));
      }

      __VERIFIED.push(tarball);
    }

    // Extract "package" directory from tarball to "target" directory
    mkdirSync(target, { recursive: true });

    await tar
      .extract({
        file,
        cwd: target,
        strip: 1,
      })
      .catch((err) => {
        ora(
          chalk.red(
            `Error extracting ${file} to ${target}: ${err.message || err}`
          )
        ).fail();
      });

    // Create .ultra file
    writeFileSync(ultraFile, "{}");

    __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);

    return {
      res: "extracted",
    };
  } catch (err) {
    // Try again but remove the file
    if (existsSync(file)) {
      unlinkSync(file);
    }

    return ultraExtract(target, tarball, sha, name);
  }
}
