/**
 *
 * @param pkg package.json content in json
 * @param opts Type of dependencies to get, use true to ignore false to add.
 * @returns Array of dependencies with name and version
 */
export const getDeps = (
  pkg: any,
  opts?: options
): Array<{
  name: string;
  version: string;
  parent?: string;
}> => {
  const deps =
    Object.keys(pkg.dependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.dependencies[dep],
        parent: undefined,
      };
    }) || [];

  const devDeps = !opts?.dev
    ? Object.keys(pkg.devDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.devDependencies[dep],
          parent: undefined,
        };
      }) || []
    : [];

  const peerDeps = !opts?.peer
    ? Object.keys(pkg.peerDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.peerDependencies[dep],
          parent: undefined,
        };
      }) || []
    : [];

  const optDeps = !opts?.opts
    ? Object.keys(pkg.optionalDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.optionalDependencies[dep],
          parent: undefined,
        };
      }) || []
    : [];

  return [...deps, ...devDeps, ...peerDeps, ...optDeps];
};

type options = {
  peer?: boolean;
  dev?: boolean;
  opts?: boolean;
};
