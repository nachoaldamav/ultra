import { symlinkSync } from 'fs';

export function symlink(src: string, dest: string) {
  return symlinkSync(src, dest, 'junction');
}
