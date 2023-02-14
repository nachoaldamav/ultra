export function clearName(name: string) {
  const nameParts = name.split('@');
  // If starts with @, it's a scoped package
  if (name.startsWith('@')) {
    return '@' + nameParts[1];
  } else {
    return nameParts[0];
  }
}
