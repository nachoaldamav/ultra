import { hardLink } from "../hardLink.js";

(async () => {
  // Read args from process
  const args = process.argv.slice(2);
  const pathname = args[0];
  const cache = args[1];

  try {
    await hardLink(pathname, cache);
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
})();
