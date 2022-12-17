import { platform } from "node:os";
import { hardLink } from "./hardlink";
import { hardLinkSync } from "./hardlink-sync";

export async function linker(src: string, dest: string) {
  if (platform() === "darwin" || platform() === "win32") {
    return hardLink(src, dest);
  } else {
    return hardLinkSync(src, dest);
  }
}
