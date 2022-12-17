import semver from "semver";

export function getSuitableVersion(versions: string[], range: string) {
  return semver.maxSatisfying(versions, range) || versions[0];
}
