import { UltraError } from '@ultrapkg/error-logger';
import { DependencyType, getDeps } from '@ultrapkg/get-deps';
import { readPackage } from '@ultrapkg/read-package';
import { writeFileSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { Yargs } from '../types/yargs';
import { install } from './install';

export async function remove(args: Yargs) {
  const packages = args.packages as string[];
  const where = process.cwd();

  if (!packages || packages.length === 0) {
    throw new UltraError(
      'ERROR_ULTRA_NO_PACKAGES_SPECIFIED',
      'No packages specified.',
      '@ultrapkg/core'
    );
  }

  const pkg = readPackage(join(process.cwd(), 'package.json'));

  const deps = getDeps(pkg);

  await Promise.all(
    deps.map(async (dep) => {
      if (packages.includes(dep.name)) {
        const type = dep.type;
        if (type === DependencyType.REGULAR) {
          pkg.dependencies[dep.name] = undefined;
        } else if (type === DependencyType.DEV) {
          pkg.devDependencies[dep.name] = undefined;
        } else if (type === DependencyType.PEER) {
          pkg.peerDependencies[dep.name] = undefined;
        } else if (type === DependencyType.OPTIONAL) {
          pkg.optionalDependencies[dep.name] = undefined;
        } else {
          throw new UltraError(
            'ERROR_ULTRA_UNKNOWN_DEPENDENCY_TYPE',
            `Unknown dependency type: ${type}`,
            '@ultrapkg/core'
          );
        }
        await rm(join(where, 'node_modules', dep.name), { recursive: true });
      }
    })
  );

  writeFileSync(join(where, 'package.json'), JSON.stringify(pkg, null, 2));

  return install(args);
}
