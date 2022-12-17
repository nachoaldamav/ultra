import os from "node:os";
import { manifestFetcher } from "@ultrapkg/manifest-fetcher";

const system = {
  platform: os.platform(),
  cpu: os.arch(),
  libc: libc,
};

export async function checkDist(dep: string) {
  const manifest = await manifestFetcher(dep);
  const { os, cpu, libc } = manifest;

  const osCompatible = compatibility(os || "any", system.platform);
  const cpuCompatible = compatibility(cpu || "any", system.cpu);
  const libcCompatible = compatibility(libc || "any", system.libc as string);

  if (!osCompatible || !cpuCompatible || !libcCompatible) return false;

  return true;
}

function compatibility(type: string | string[], value: string) {
  if (type === "any") return true;

  if (Array.isArray(type)) {
    return type.includes(value);
  }

  return type === value;
}
