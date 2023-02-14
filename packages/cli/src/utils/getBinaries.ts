import { readdirSync } from 'fs';

export function getBinaries(binPath: string) {
  try {
    return readdirSync(binPath);
  } catch (e) {
    return [];
  }
}
