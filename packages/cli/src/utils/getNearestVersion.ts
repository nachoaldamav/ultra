import pickManifest from "npm-pick-manifest";

export function getNearestVersion(version: string, data: any) {
  return pickManifest(data, version).version;
}
