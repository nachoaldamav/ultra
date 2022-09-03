import { existsSync } from "fs";
import { mkdir, rm, symlink } from "fs/promises";

export async function installLocalDep(pkg: { name: string; version: string }) {
    // Create symlink from local package to node_modules
    try {
        const pkgProjectDir = `${process.cwd()}/node_modules/${pkg.name}`;
        if (existsSync(pkgProjectDir)) {
            await rm(pkgProjectDir, { recursive: true });
            const dirs = pkgProjectDir.split("/");
            dirs.pop();
            await mkdir(dirs.join("/"), { recursive: true });
            await symlink(pkg.version.split("file:")[1], pkgProjectDir, "dir");
            return;
        } else {
            const dirs = pkgProjectDir.split("/");
            dirs.pop();
            await mkdir(dirs.join("/"), { recursive: true });
            await symlink(pkg.version.split("file:")[1], pkgProjectDir, "dir");
            return;
        }
    } catch (error: any) {
    }
}
