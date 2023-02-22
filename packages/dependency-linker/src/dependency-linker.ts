import type { DependencyMap, Dep } from '@ultrapkg/dependency-resolver';
import { linker } from '@ultrapkg/linker';
import { extract } from '@ultrapkg/extract-tar';
import { readConfig } from '@ultrapkg/read-config';
import { readPackage } from '@ultrapkg/read-package';
import { checkDist } from '@ultrapkg/check-dist';
import { logger } from '@ultrapkg/logger';
import { satisfies } from 'semver';
import binLinks from 'bin-links';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { rm } from 'fs/promises';

type LinkerOptions = {
  /**
   * The current working directory.
   * This is where the node_modules folder will be created.
   * @default process.cwd()
   */
  cwd: string;
  /**
   * Whether to install peer dependencies.
   * @default false
   */
  installPeers?: boolean;
};

type Dependency = {
  spec: string;
  path: string;
  type: string;
  tarball: string;
  sha: string;
  parent: string[];
};

type ResolveDepInfo = {
  name: string;
  version: string;
  path: string;
  cachePath: string;
  tarball: string;
  sha: string;
  parentPath?: string;
  type: string;
  alias?: string;
};

const config = readConfig();

export class DependencyLinker {
  constructor(private readonly opts: LinkerOptions) {
    // If cwd is not provided, use the current working directory
    if (!opts.cwd) {
      this.opts.cwd = process.cwd();
    }
    // If installPeers is not provided, set it to false
    if (!opts.installPeers) {
      this.opts.installPeers = false;
    }
  }

  readonly cacheDir = config.cache;

  async link(deps: DependencyMap) {
    if (!existsSync(join(this.opts.cwd, 'node_modules'))) {
      mkdirSync(join(this.opts.cwd, 'node_modules'), { recursive: true });
    }

    writeFileSync(
      join(this.opts.cwd, 'node_modules', 'ultra.lock'),
      JSON.stringify(Object.fromEntries(deps), null, 2)
    );

    const asyncFunctions: Array<() => Promise<void | any[]>> = [];
    const linkFunctions: Array<() => Promise<void | any[]>> = [];

    deps.forEach((value, key) => {
      for (const [innerKey, innerValue] of Object.entries(value)) {
        if (!innerKey.startsWith('file:')) {
          asyncFunctions.push(async () => {
            const { path, type, tarball, sha } = innerValue as Dependency;
            const version = innerKey;
            const name = key;

            if (type === 'peer') {
              if (!this.opts.installPeers) {
                logger.add(`peer-${name}`, {
                  text: `Skipping peer dependency ${name}@${version}`,
                  color: 'yellow',
                  status: 'non-spinnable',
                });
                return;
              }
            } else if (type === 'optional') {
              const compatible = await checkDist(`${name}@${version}`);
              if (!compatible) {
                return;
              }
            }

            const isCached = this.checkCache(name, version);

            if (existsSync(join(this.opts.cwd, path))) {
              const pkg = readPackage(
                join(this.opts.cwd, path, 'package.json')
              );
              if (pkg.version === version) {
                return;
              }

              await rm(join(this.opts.cwd, path), {
                recursive: true,
                force: true,
              });
            }

            if (isCached) return this.linkDependency(name, version, path);

            this.updateIndex(name, version, { tarball, sha });

            return this.installAndLinkDependency(
              name,
              version,
              path,
              tarball as string,
              sha as string
            );
          });
        } else {
          linkFunctions.push(async () => {
            const { parent, spec } = innerValue as Dependency;
            const name = key;

            const parents = parent[0].split('/');
            parents.shift();
            const strPath = `node_modules/${parents.join('/node_modules/')}`;

            function findPath() {
              const dep = deps.get(name) as Dep;

              const versions = Object.keys(dep);

              const suitableVersion = versions.find((v) => {
                return satisfies(v, spec);
              });

              if (!suitableVersion) {
                return null;
              }

              const { path } = dep[suitableVersion] as Dependency;
              return path;
            }

            const srcPath = resolve(this.opts.cwd, findPath() as string);

            if (!srcPath) {
              console.log(
                `Could not find a suitable version of ${name} for ${spec}`
              );
              return;
            }
            const destPath = join(this.opts.cwd, strPath, 'node_modules', name);

            if (existsSync(srcPath)) {
              mkdirSync(join(dirname(destPath)), { recursive: true });
              return linker(srcPath, destPath, 'symlink');
            }

            return;
          });
        }
      }
    });

    await Promise.all(asyncFunctions.map((fn) => fn()));
    return Promise.all(linkFunctions.map((fn) => fn()));
  }

  async linkOne(info: ResolveDepInfo) {
    if (info.version.startsWith('file:')) {
      const srcPath = resolve(this.opts.cwd, info.version.slice(5));
      const destPath = join(
        this.opts.cwd,
        info.parentPath as string,
        'node_modules',
        info.name
      );

      if (existsSync(srcPath)) {
        mkdirSync(join(dirname(destPath)), { recursive: true });
        return linker(srcPath, destPath, 'symlink');
      }

      return;
    }

    if (info.type === 'peer') {
      if (!this.opts.installPeers) {
        logger.add(`peer-${info.name}`, {
          text: `Skipping peer dependency ${info.name}@${info.version}`,
          color: 'yellow',
          status: 'non-spinnable',
        });
        return;
      }
    } else if (info.type === 'optional') {
      const compatible = await checkDist(`${info.name}@${info.version}`);
      if (!compatible) {
        return;
      }
    }

    const isCached = this.checkCache(info.name, info.version);

    if (existsSync(info.path)) {
      const pkg = existsSync(join(info.path, 'package.json'))
        ? readPackage(join(info.path, 'package.json'))
        : { version: '0.0.0' };

      if (pkg.version === info.version) {
        return;
      }

      await rm(info.path, {
        recursive: true,
        force: true,
      });
    }

    if (isCached)
      return this.linkDependency(info.name, info.version, info.path).catch(
        (e) => {
          if (e.code === 'EEXIST') {
            return;
          }
          throw e;
        }
      );

    this.updateIndex(info.name, info.version, {
      tarball: info.tarball,
      sha: info.sha,
    });

    return this.installAndLinkDependency(
      info.name,
      info.version,
      info.path,
      info.tarball,
      info.sha
    );
  }

  private checkCache(name: string, version: string) {
    const cachePath = resolve(this.cacheDir, name, version);
    return existsSync(cachePath);
  }

  private async updateIndex(
    name: string,
    version: string,
    information: {
      tarball: string;
      sha: string;
    }
  ) {
    const index = join(this.cacheDir, name, 'index.json');
    if (!existsSync(index)) {
      mkdirSync(dirname(index), { recursive: true });
      writeFileSync(index, JSON.stringify({}));
    }

    const indexData = JSON.parse(readFileSync(index, 'utf-8'));

    indexData[version] = {
      tarball: information.tarball,
      sha: information.sha,
    };

    writeFileSync(index, JSON.stringify(indexData));
  }

  private async linkDependency(name: string, version: string, path: string) {
    const cachePath = resolve(this.cacheDir, name, version);

    await linker(cachePath, join(this.opts.cwd, path), 'hard');
    logger.update('linker', {
      text: `Installing ${name}@${version}`,
    });

    return this.installBinaries(path);
  }

  private async installAndLinkDependency(
    name: string,
    version: string,
    path: string,
    tarball: string,
    sha: string
  ) {
    const cachePath = resolve(this.cacheDir, name, version);

    const status = await extract(cachePath, tarball, sha, name);

    logger.update('linker', {
      text: `Installing ${name}@${version}`,
    });

    if (status && status.res === 'skipped') {
      return;
    }

    await linker(cachePath, join(this.opts.cwd, path), 'hard');

    return this.installBinaries(path);
  }

  private async installBinaries(path: string) {
    const pkgPath = join(this.opts.cwd, path, 'package.json');

    if (!existsSync(pkgPath)) {
      return;
    }

    const pkg = readPackage(pkgPath);

    return binLinks({
      path: join(this.opts.cwd, path),
      pkg,
      force: true,
    });
  }
}
