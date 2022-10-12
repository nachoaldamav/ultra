import { readdir, lstat, mkdir, link } from "node:fs/promises";
import { join, dirname } from "node:path";

export async function hardLink(source: string, target: string) {
  const files = await readdir(source);
  return Promise.all(
    files.map(async (file): Promise<any> => {
      const sourcePath = join(source, file);
      const targetPath = join(target, file);
      const stats = await lstat(sourcePath);

      try {
        await mkdir(dirname(targetPath), { recursive: true });
        if (stats.isDirectory()) {
          return hardLink(sourcePath, targetPath);
        }
        return link(sourcePath, targetPath);
      } catch (e: any) {
        throw e;
      }
    })
  );
}
