import { UltraError } from '../dist/index.js';

(async () => {
  const error = new UltraError(
    'ERR_ULTRA_READ_PACKAGE',
    'Could not read package.json',
    '@ultrapkg/read-package'
  );

  throw error;
})();
