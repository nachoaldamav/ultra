import { existsSync, readFileSync } from 'node:fs';
import { UltraError } from '@ultrapkg/error-logger';

export function readPackage(path: string) {
  if (!existsSync(path))
    throw new UltraError(
      'ERR_ULTRA_NO_PACKAGE',
      `No package.json found at ${path}`,
      '@ultrapkg/read-package'
    );

  try {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    if (pkg.bundledDependencies) {
      pkg.bundleDependencies = pkg.bundledDependencies;
      pkg.bundledDependencies = undefined;
    }
    if (typeof pkg.bin === 'string') {
      pkg.bin = { [pkg.name]: pkg.bin };
    }
    return pkg;
  } catch (err: any) {
    throw new UltraError(
      'ERR_ULTRA_READ_PACKAGE',
      `Failed to read package.json at ${path}`,
      '@ultrapkg/read-package'
    );
  }
}
