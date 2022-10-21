import os from "node:os";
import { GLIBC, MUSL } from "detect-libc";

const system = {
  platform: os.platform(),
  arch: os.arch(),
};

const regxp =
  /(?<package>\w+)[-|\/](?<os>\blinux\b|\bwindows\b|\bandroid\b|\bdarwin\b|\bfreebsd\b|\bsunos\b|\bopenbsd\b|\bnetbsd\b|\bwin32\b|\bwin64\b)\-?(?<arch>\w+)?\-?(?<dist>\beabi\b|\bmsvc\b|\bgnueabihf\b|\bgnu\b|\bmusl\b)?/gm;

export function checkDist(dep: string) {
  const matches = dep.matchAll(regxp);
  const match = matches.next().value;

  if (!match) {
    return true;
  }

  const { os, arch, dist } = match.groups;

  if (system.platform === os) {
    if (system.arch === (arch.startsWith("x") ? arch : "x" + arch)) {
      if (dist && libc) {
        if (libc === GLIBC) {
          return dist === "gnu";
        } else if (libc === MUSL) {
          return dist === "musl";
        }
      } else {
        return true;
      }

      return false;
    }

    return false;
  }

  return false;
}
