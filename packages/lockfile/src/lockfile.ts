import { readPackage } from '@ultrapkg/read-package';
import { getDeps } from '@ultrapkg/get-deps';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { platform } from 'os';
import { join } from 'path';
import crypto from 'crypto';

export type Dep = {
  [key: string]: {
    spec: string;
    parent?: string[] | undefined;
    optional?: boolean | undefined;
    path: string;
    type: DependencyType;
    tarball?: string | undefined;
    sha?: string | undefined;
  };
};

enum DependencyType {
  REGULAR = 'regular',
  DEV = 'dev',
  PEER = 'peer',
  OPTIONAL = 'optional',
}

type depCache = Map<string, Dep>;

export async function readLockfile(path: string): Promise<{
  dependencies: { [key: string]: Dep };
  depsHash: string;
  lockVersion: number;
}> {
  if (!existsSync(path)) {
    throw new Error(`Lockfile ${path} does not exist`);
  }

  if (platform() === 'win32' || platform() === 'darwin') {
    const data = JSON.parse(await readFile(path, 'utf8'));
    const lockInfo: {
      depsHash: string;
      lockVersion: number;
    } = data.ultra;
    data.ultra = undefined;
    return {
      dependencies: data,
      ...lockInfo,
    };
  }

  const data = JSON.parse(readFileSync(path, 'utf8'));
  const lockInfo = data.ultra;
  data.ultra = undefined;
  return {
    dependencies: data,
    ...lockInfo,
  };
}

export function createLockFile(depMap: depCache, cwd: string) {
  const pkg = readPackage(join(cwd, 'package.json'));
  const dependencies = JSON.stringify(getDeps(pkg));

  const hash = crypto.createHash('sha256');
  hash.update(dependencies);

  const lockFile: {
    [key: string]: Dep | { depsHash: string; lockVersion: number };
  } = {
    ultra: {
      depsHash: hash.digest('hex'),
      lockVersion: 1,
    },
  };

  depMap.forEach((dep, key) => {
    lockFile[key] = {
      ...dep,
    };
  });

  return writeFileSync(
    join(cwd, 'ultra.lock'),
    JSON.stringify(lockFile, null, 2)
  );
}
