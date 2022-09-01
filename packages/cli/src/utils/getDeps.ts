export const getDeps = (pkg: any) => {
  const deps =
    Object.keys(pkg.dependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.dependencies[dep],
      };
    }) || [];

  const devDeps =
    Object.keys(pkg.devDependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.devDependencies[dep],
      };
    }) || [];

  const peerDeps =
    Object.keys(pkg.peerDependencies || {}).map((dep) => {
      return {
        name: dep,
        version: pkg.peerDependencies[dep],
      };
    }) || [];
  return [...deps, ...devDeps, ...peerDeps];
};
