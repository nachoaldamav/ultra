import { performance } from 'perf_hooks';
import { logger } from '@ultrapkg/logger';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { eventHandler, EventType } from '@ultrapkg/event-handler';
import { join } from 'path';
import { convertTime } from '../utils/parse-time';

export async function install(args: any) {
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
    JSON.stringify(Object.fromEntries(map), null, 2),
  );

  log.succeed({
    text: `Resolved ${length} dependencies in ${convertTime(
      performance.now() - __resolve_start,
    )}! 🚀`,
  });

  while (links.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  installLog.succeed({
    text: `Installed ${length} dependencies in ${convertTime(
      performance.now() - __link_start,
    )}! 🚀`,
  });

  logger.add('finish', {
    text: `Ultra finished in ${convertTime(
      performance.now() - __init_start,
    )}! 🚀`,
  });
}
