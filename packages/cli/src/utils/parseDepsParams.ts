import { manifestFetcher } from "@ultrapkg/manifest-fetcher";

export default async function getParamsDeps(opts: string[]) {
  const instalableDeps = opts.filter((opt) => !opt.startsWith("-"));

  const addDeps =
    instalableDeps.map(async (dep) => {
      const res = await manifestFetcher(dep, {
        registry: REGISTRY,
      });

      // Return the dependency with version
      return {
        name: res.name,
        version: res.version,
      };
    }) || [];

  return await Promise.all(addDeps);
}
