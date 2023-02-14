import { UltraError } from '../dist/index.js';

/* new UltraError(
  'ERR_ULTRA_READ_PACKAGE',
  'Could not read package.json',
  '@ultrapkg/read-package'
); */

(async () => {
  const error = new UltraError(
    'ERR_ULTRA_READ_PACKAGE',
    'Could not read package.json',
    '@ultrapkg/read-package'
  );

  console.error(error.error);
})();
