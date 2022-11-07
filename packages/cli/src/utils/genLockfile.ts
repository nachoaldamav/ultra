import type { ultra_lock } from "../../types/pkg";
import glob from "glob";
import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import os from "os";

export function genLock() {
  // Get all ".ultra" files inside node_modules
  const files = glob.sync("**/.ultra", {
    cwd: join(process.cwd(), "node_modules"),
    absolute: false,
  });

  const deps = files.map((file) => {
    const data = readFileSync(join("node_modules", file), "utf-8");
    const parsed = JSON.parse(data);
    const { name, version, integrity, path, tarball } = parsed["ultra:self"];

    return {
      name: name,
      version: version,
      integrity: integrity,
      tarball: tarball,
      path: join("/node_modules", file.replace("/.ultra", "")),
      cache: path.replace(join(os.homedir(), ".ultra-cache"), ""),
    };
  });

  const lock: ultra_lock = {};

  deps.forEach((dep) => {
    if (!lock[dep.name]) {
      lock[dep.name] = {};
    }

    lock[dep.name][dep.version] = {
      path: dep.path,
      cache: dep.cache,
      tarball: dep.tarball,
      integrity: dep.integrity,
    };
  });

  writeFileSync(
    join(process.cwd(), "ultra.lock"),
    JSON.stringify(lock, null, 2),
    "utf-8"
  );

  return lock;
}
