import { readPackage } from '@ultrapkg/read-package';
import { join } from 'path';

export function getScript(script: string) {
  const pkg = readPackage(join(process.cwd(), 'package.json'));
  const scripts = pkg.scripts;
  if (!scripts) {
    return null;
  }

  return scripts[script];
}
