import { platform } from 'node:os';
import { hardLink } from './hardlink';
import { hardLinkSync } from './hardlink-sync';
import { symlink } from './symlink';

type MODES = 'hard' | 'symlink';

export async function linker(src: string, dest: string, mode: MODES = 'hard') {
  if (mode === 'symlink') {
    return symlink(src, dest);
  }

  if (platform() === 'darwin' || platform() === 'win32') {
    return hardLink(src, dest);
  } else {
    return hardLinkSync(src, dest);
  }
}
