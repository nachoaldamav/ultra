export function getVersion(dep: string) {
  const splitted = dep.split('@');
  if (dep.startsWith('@')) {
    if (splitted.length <= 2) return 'no_version';
    return splitted[2];
  }

  if (splitted.length === 1) return 'no_version';
  return splitted[1];
}
