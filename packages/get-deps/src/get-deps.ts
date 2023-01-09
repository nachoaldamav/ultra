/**
 * @param pkg package.json content in json
 * @param opts Type of dependencies to get, use true to ignore or false to add.
 * @returns Array of dependencies with name and version
 */
export const getDeps = (pkg: any, opts?: options): Dependency[] => {
  const deps =
    Object.keys(pkg.dependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.dependencies[dep],
        parent: null,
        optional: false,
        type: DependencyType.REGULAR,
      };
    }) || [];

  const devDeps = !opts?.dev
    ? Object.keys(pkg.devDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.devDependencies[dep],
          parent: null,
          optional: false,
          type: DependencyType.DEV,
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
            parent: null,
            optional: false,
            type: DependencyType.PEER,
          };
        })
        .filter((dep) => dep) || []
    : [];

  const optDeps = !opts?.opts
    ? Object.keys(pkg.optionalDependencies || {}).map((dep) => {
        return {
          name: dep,
          version: pkg.optionalDependencies[dep],
          parent: null,
          optional: true,
          type: DependencyType.OPTIONAL,
        };
      }) || []
    : [];

  return [...deps, ...devDeps, ...peerDeps, ...optDeps].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
};

export enum DependencyType {
  REGULAR = "regular",
  DEV = "dev",
  PEER = "peer",
  OPTIONAL = "optional",
}

type Dependency = {
  name: string;
  version: string;
  parent: string | string[] | null;
  type: DependencyType;
  optional?: boolean;
};

type options = {
  peer?: boolean;
  dev?: boolean;
  opts?: boolean;
};
