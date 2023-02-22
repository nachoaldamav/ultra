import { UltraError } from '@ultrapkg/error-logger';
import {
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
} from 'node:fs';
import path from 'node:path';

export function hardLinkSync(dir: string, targetDir: string) {
  try {
    const files = readdirSync(dir);
    return files.map((file) => {
      const filePath = path.join(dir, file);
      const targetPath = path.join(targetDir, file);
      const stat = lstatSync(filePath);
      if (stat.isDirectory()) {
        mkdirSync(targetPath, { recursive: true });
        hardLinkSync(filePath, targetPath);
      } else {
        // Create previous folders if they don't exist
        mkdirSync(path.dirname(targetPath), { recursive: true });
        try {
          linkSync(filePath, targetPath);
        } catch (e: any) {
          if (e.code === 'EEXIST') return;
          if (e.code === 'EXDEV') return copyFileSync(filePath, targetPath);
          throw new UltraError(
            'ERR_ULTRA_HARDLINK',
            `Failed to hardlink ${filePath} to ${targetPath}`,
            '@ultrapkg/linker'
          );
        }
      }
    });
  } catch (e) {
    throw e;
  }
}
