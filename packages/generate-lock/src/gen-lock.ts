import type { ultra_lock } from '@ultrapkg/types/pkg';
import glob from 'glob';
import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';

type DEP = {
  name: string;
  version: string;
  integrity: string;
  tarball: string;
  path: string;
  cache: string;
};

export function genLock() {
  // Get all ".ultra" files inside node_modules
  const files = glob.sync('**/.ultra', {
    cwd: join(process.cwd(), 'node_modules'),
    absolute: false,
  });

  // @ts-ignore-next-line
  const deps: DEP[] = files
    .map((file) => {
      const data = readFileSync(join('node_modules', file), 'utf-8');
      const parsed = JSON.parse(data);
      try {
        const { name, version, integrity, path, tarball } =
          parsed['ultra:self'];

        return {
          name: name,
          version: version,
          integrity: integrity,
          tarball: tarball,
          path: join('/node_modules', file.replace('/.ultra', '')),
          cache: path.replace(join(os.homedir(), '.ultra-cache'), ''),
        };
      } catch (e) {
        return null;
      }
    })
    .filter((dep) => {
      return dep !== null;
    });

  const lock: ultra_lock = {};

  // Filter null values
  deps.forEach((dep: DEP) => {
    if (!lock[dep.name]) {
      lock[dep.name] = {};
    }

    lock[dep.name][dep.version] = {
      path: dep.path,
      cache: dep.cache,
      tarball: dep.tarball,
      integrity: dep.integrity,
    };
  });

  writeFileSync(
    join(process.cwd(), 'ultra.lock'),
    JSON.stringify(lock, null, 2),
    'utf-8',
  );

  return lock;
}
