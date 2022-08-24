import fs from "fs";
import https from "https";
import tar from "tar";
import path from "path";
import { rename, mkdir, rm } from "fs/promises";
import ora from "ora";
import chalk from "chalk";

export async function downloadPackage(
  tarball: string,
  name: string,
  tmpDir: string
) {
  // First remove package if it already exists in node_modules
  const packagePath = path.join(process.cwd(), "node_modules", name);
  if (fs.existsSync(packagePath)) {
    await rm(packagePath, { recursive: true });
  }

  // Remove @ and / from package name
  const sanitizeName = name.replace(/@/g, "").replace(/\//g, "");
  const tmpPackageDir = path.join(tmpDir, name);
  const tmpPackageTarball = path.join(tmpDir, `${sanitizeName}.tgz`);
  await mkdir(tmpPackageDir, { recursive: true });
  const file = fs.createWriteStream(tmpPackageTarball);
  const request = https.get(tarball, function (response) {
    response.pipe(file);
  });
  await new Promise((resolve, reject) => {
    request.on("error", (error) => {
      reject(error);
    });
    file.on("finish", () => {
      file.close();
      resolve(true);
    });
  });
  await tar.x({ file: tmpPackageTarball, C: tmpPackageDir });
  // Save package into CWD node_modules folder
  // Create folders if they don't exist
  const node_path = path.join(process.cwd(), "/node_modules", name);
  await mkdir(node_path, { recursive: true });

  try {
    // Check if /package folder exists inside tmpPackageDir
    const packageFolder = path.join(tmpPackageDir, "/package");
    if (fs.existsSync(packageFolder)) {
      // Rename package folder to /node_modules/package
      await rename(packageFolder, node_path)
        .catch((error) => {})
        .finally(async () => {
          // Remove tmp package folder
          return await rm(tmpPackageTarball, { recursive: true });
        });
    } else {
      // Rename package folder to /node_modules/{package name}
      await rename(tmpPackageDir, node_path)
        .catch((error) => {
          ora(
            chalk.red(
              `Error renaming ${tmpPackageDir} to ${node_path}: ${error}`
            )
          ).fail();
        })
        .finally(async () => {
          return await rm(tmpPackageTarball, { recursive: true });
        });
    }
  } catch (error) {
    console.log(error);
  }
}
