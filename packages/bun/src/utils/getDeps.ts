/**
 *
 * @param pkg package.json content in json
 * @param opts Type of dependencies to get, use true to ignore false to add.
 * @returns Array of dependencies with name and version
 */
export const getDeps = (
  pkg: any,
  opts?: options,
): Array<{
  name: string;
  version: string;
  parent?: string;
  optional?: boolean;
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
    ? Object.keys(pkg.peerDependencies || {})
        .filter((dep) => {
          // Remove peer dependencies that are optional in pkg.peerDependenciesMeta
          if (pkg.peerDependenciesMeta) {
            return !pkg.peerDependenciesMeta[dep]?.optional;
          } else {
            return true;
          }
        })
        .map((dep) => {
          return {
            name: dep,
            version: pkg.peerDependencies[dep],
            parent: undefined,
          };
        })
        .filter((dep) => dep) || []
    : [];

  const optDeps = !opts?.opts
    ? Object.keys(pkg.optionalDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.optionalDependencies[dep],
          parent: undefined,
          optional: true,
        };
      }) || []
    : [];

  return [...deps, ...devDeps, ...peerDeps, ...optDeps].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
};

type options = {
  peer?: boolean;
  dev?: boolean;
  opts?: boolean;
};
