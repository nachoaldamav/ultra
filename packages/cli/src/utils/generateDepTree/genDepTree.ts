import chalk from 'chalk';
import { getDeps } from '../getDeps.js';
import manifestFetcher from '../manifestFetcher.js';
import readPackage from '../readPackage.js';

class dependencyMapper {
  private map: Object;
  constructor() {
    this.map = {};
  }

  has(key: string) {
    return this.map.hasOwnProperty(key);
  }

  get(key: string) {
    return this.map[key];
  }

  set(key: string, value: any) {
    this.map[key] = value;
  }

  delete(key: string) {
    // @ts-ignore-next-line
    delete this.map[key];
  }
}

const dependencyMap = new dependencyMapper();

const MOCK_PACKAGE = {
  react: {
    '1.0.0': {
      parent: 'react-dom',
      optional: false,
      fromMonorepo: false,
    },
    '2.0.0': {
      parent: 'react-dom',
      optional: false,
      fromMonorepo: false,
    },
  },
  'react-dom': {
    '1.0.0': {
      parent: 'react',
      optional: false,
      fromMonorepo: false,
    },
    '2.0.0': {
      parent: 'react',
      optional: false,
      fromMonorepo: false,
    },
  },
};

export async function genDepTree(pkg: string) {
  const baseDeps = getDeps(readPackage(pkg));

  // Recursively add dependencies to the dependency map, fetching the
  // dependency's package.json and adding its dependencies to the map.
  // This is a depth-first search.
  const addDeps = async (deps: any) => {
    return await Promise.all(
      deps.map(async (dep: any) => {
        const { name, version } = dep;

        // If the dependency is already in the map, skip it.
        if (dependencyMap.has(name) && dependencyMap.get(name).has(version)) {
          return;
        }

        const manifest = await manifestFetcher(`${name}@${version}`);

        console.log(chalk.green(`Adding ${name}@${version}`));

        if (!dependencyMap.has(name)) {
          dependencyMap.set(name, {});
        }

        const versions = dependencyMap.get(name);
        versions.set(version, dep);

        const dependencies = getDeps(manifest, {
          dev: true,
        });

        console.log(chalk.green(`Adding ${name}@${version} dependencies`));
        await addDeps(dependencies);
      }),
    );
  };

  await addDeps(baseDeps);

  return dependencyMap;
}
