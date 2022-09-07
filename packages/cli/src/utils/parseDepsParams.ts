import chalk from "chalk";
import ora from "ora";
import pacote from "pacote";

export default async function getParamsDeps(opts: string[]) {
  const instalableDeps = opts.filter((opt) => !opt.startsWith("-"));

  const addDeps =
    instalableDeps.map(async (dep) => {
      const res = await pacote.manifest(dep, {
        registry: "https://registry.npmjs.org/",
      });

      // Return the dependency with version
      return {
        name: res.name,
        version: res.version,
      };
    }) || [];

  return await Promise.all(addDeps);
}
