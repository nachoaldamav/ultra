import { performance } from 'perf_hooks';
import { logger } from '@ultrapkg/logger';
import { createLockFile } from '@ultrapkg/lockfile';
import { eventHandler, EventType } from '@ultrapkg/event-handler';
import { readPackage } from '@ultrapkg/read-package';
import { getDeps } from '@ultrapkg/get-deps';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { rm } from 'fs/promises';
import { convertTime } from '../utils/parse-time';

export async function install(args: any) {
  const lockFile = existsSync(join(process.cwd(), 'ultra.lock'));

  if (lockFile) {
    return installFromLock();
  }

  const __init_start = performance.now();
  const where =
    args.where || args.w
      ? (args.where as string) || (args.w as string)
      : process.cwd();

  const { resolver } = await import('@ultrapkg/dependency-resolver');
  const { DependencyLinker } = await import('@ultrapkg/dependency-linker');

  const linker = new DependencyLinker({
    cwd: where,
    installPeers: true,
  });

  const links: any[] = [];

  eventHandler.on(EventType.ResolvedDep, async (dep) => {
    links.push(dep);
    await linker.linkOne(dep);
    links.splice(links.indexOf(dep), 1);
  });

  const log = logger.add('resolver', {
    text: 'Resolving dependencies...',
  });
  log.start();
  const __resolve_start = performance.now();

  const installLog = logger.add('linker', {
    text: 'Installing dependencies...',
  });

  const __link_start = performance.now();

  const map = await resolver(join(where, 'package.json'));
  const length = Array.from(map.values()).length;

  if (!existsSync(join(where, 'node_modules'))) {
    mkdirSync(join(where, 'node_modules'), { recursive: true });
  }

  writeFileSync(
    join(where, 'node_modules', 'ultra.lock'),
    JSON.stringify(Object.fromEntries(map), null, 2)
  );

  log.succeed({
    text: `Resolved ${length} dependencies in ${convertTime(
      performance.now() - __resolve_start
    )}! 🚀`,
  });

  while (links.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  installLog.succeed({
    text: `Installed ${length} dependencies in ${convertTime(
      performance.now() - __link_start
    )}! 🚀`,
  });

  logger.add('finish', {
    text: `Ultra finished in ${convertTime(
      performance.now() - __init_start
    )}! 🚀`,
  });

  createLockFile(map, where);
}

async function installFromLock(): Promise<void> {
  const { DependencyLinker } = await import('@ultrapkg/dependency-linker');
  const { readLockfile } = await import('@ultrapkg/lockfile');

  const where = process.cwd();

  const linker = new DependencyLinker({
    cwd: where,
    installPeers: true,
  });

  const lockfile = await readLockfile(join(where, 'ultra.lock'));

  const linker_logger = logger.add('linker', {
    text: 'Reading lockfile...',
    color: 'green',
  });

  const localHash = getDepHash(where);
  const lockHash = lockfile.depsHash;

  if (localHash !== lockHash) {
    logger.add('outdated', {
      text: 'Dependencies are outdated, running install...',
      status: 'non-spinnable',
    });

    await rm(join(where, 'ultra.lock'), { force: true });

    return install({ where });
  } else {
    const __lockfile_start = performance.now();

    const dependencies: Array<any> = [];

    for (const dependency in lockfile.dependencies) {
      for (const version in lockfile.dependencies[dependency]) {
        // @ts-ignore-next-line
        const dep = lockfile.dependencies[dependency][version];
        dependencies.push({
          name: dependency,
          version,
          path: dep.path.replace('file:', './'),
          type: dep.type,
          cachePath: join(userUltraCache, dependency, version),
          tarball: dep.tarball || '',
          sha: dep.sha || '',
          parentPath: (dep.parent as string[])[0],
        });
      }
    }

    await Promise.all(
      dependencies.map(async (dep) => {
        linker_logger.update({
          text: `Linking ${dep.name}@${dep.version}...`,
        });
        return linker.linkOne(dep);
      })
    );

    logger.succeed('linker', {
      text: `Installed ${
        Object.keys(lockfile.dependencies).length
      } dependencies in ${convertTime(
        performance.now() - __lockfile_start
      )}! 🚀`,
      color: 'green',
    });

    return;
  }
}

function getDepHash(where: string) {
  const packageJson = readPackage(join(where, 'package.json'));
  const deps = getDeps(packageJson);

  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(deps));

  return hash.digest('hex');
}
