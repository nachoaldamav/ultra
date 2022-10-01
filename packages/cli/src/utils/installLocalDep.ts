import { existsSync } from "fs";
import { mkdirSync, rmSync, symlinkSync } from "fs";
import path from "path";

export async function installLocalDep(pkg: { name: string; version: string }) {
  // Create symlink from local package to node_modules
  try {
    const pkgProjectDir = `${process.cwd()}/node_modules/${pkg.name}`;
    if (existsSync(pkgProjectDir)) {
      rmSync(pkgProjectDir, { recursive: true });
      mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
      symlinkSync(pkg.version.split("file:")[1], pkgProjectDir, "junction");
      return;
    } else {
      mkdirSync(path.dirname(pkgProjectDir), { recursive: true });
      symlinkSync(pkg.version.split("file:")[1], pkgProjectDir, "junction");
      return;
    }
  } catch (error: any) {}
}
