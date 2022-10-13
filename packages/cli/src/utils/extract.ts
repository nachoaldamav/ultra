import tar from "tar";
import axios from "axios";
import {
  createWriteStream,
  mkdirSync,
  existsSync,
  writeFileSync,
  rmSync,
} from "fs";
import os from "os";
import path from "path";

// Get system temp directory
const tmpDir = os.tmpdir();

const cacheBasePath = path.join(tmpDir, "ultra_tmp");

export async function ultraExtract(
  target: string,
  tarball: string
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

    await tar.extract({
      file,
      cwd: target,
      strip: 1,
    });

    __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);
    // Create .ultra file
    writeFileSync(ultraFile, "{}");

    return {
      res: "extracted",
    };
  } catch (e) {
    __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);
    rmSync(file, { recursive: true, force: true });
    return ultraExtract(target, tarball);
  }
}
