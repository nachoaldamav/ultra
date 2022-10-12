import tar from "tar";
import axios from "axios";
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import ora from "ora";
import chalk from "chalk";

// Get system temp directory
const tmpDir = os.tmpdir();

const cacheBasePath = path.join(tmpDir, "ultra_tmp");

export async function ultraExtract(target: string, tarball: string) {
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

  if (!existsSync(file)) {
    const writer = createWriteStream(file);
    const response = await axios({
      url: tarball,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
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
}
