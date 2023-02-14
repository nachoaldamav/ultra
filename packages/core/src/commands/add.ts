import type { Yargs } from '../types/yargs';
import { readPackage } from '@ultrapkg/read-package';
import { manifestFetcher } from '@ultrapkg/manifest-fetcher';
import { install } from './install';
import { getVersion } from '../utils/get-version';
import { writeFileSync } from 'fs';
import { join } from 'path';

type Deps = {
  name: string;
  version: string;
  spec: string;
  exact?: boolean;
};

export async function add(args: Yargs) {
  const { dev, exact, peer, optional } = args;
  const packages = args.packages as string[];
  const where = process.cwd();
  const pkg = readPackage(where);

  const dependencies = packages.map(async (pkg: string) => {
    const dependency = await manifestFetcher(pkg);
    const specVersion = getVersion(pkg);

    return {
      name: dependency.name,
      version: dependency.version,
      spec: specVersion === 'no_version' ? dependency.version : specVersion,
    };
  });

  const deps = await Promise.all(dependencies);

  const type = dev
    ? 'devDependencies'
    : peer
    ? 'peerDependencies'
    : optional
    ? 'optionalDependencies'
    : 'dependencies';

  pkg[type] = pkg[type] || {};

  deps.forEach((dep: Deps) => {
    if (exact) {
      pkg[type][dep.name] = dep.version;
    } else {
      pkg[type][dep.name] = dep.spec;
    }
  });

  writeFileSync(join(where, 'package.json'), JSON.stringify(pkg, null, 2));

  return install({
    where,
  });
}
