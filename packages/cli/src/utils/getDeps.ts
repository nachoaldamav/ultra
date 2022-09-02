/**
 * 
 * @param pkg package.json content in json
 * @param opts Type of dependencies to get, use true to ignore false to add.
 * @returns Array of dependencies with name and version
 */

export const getDeps = (pkg: any, opts?: options) => {
  const deps =
    Object.keys(pkg.dependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.dependencies[dep],
      };
    }) || [];

  const devDeps = !opts?.dev ?
    Object.keys(pkg.devDependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.devDependencies[dep],
      };
    }) || [] : []

  const peerDeps = !opts?.peer ?
    Object.keys(pkg.peerDependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.peerDependencies[dep],
      };
    }) || [] : []

  const optDeps = !opts?.opts ?
    Object.keys(pkg.optionalDependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.optionalDependencies[dep]
      };
    }) || [] : []

  return [...deps, ...devDeps, ...peerDeps, ...optDeps];
};

type options = {
  peer?: boolean,
  dev?: boolean,
  opts?: boolean
}