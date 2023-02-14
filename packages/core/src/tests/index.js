import test from 'ava';
import { ultraCore } from '../../dist/index.js';
import { rm } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const __dirname = new URL('.', import.meta.url).pathname;

test('Basic test', async (t) => {
  const where = join(__dirname, 'fixtures', 'vite-project');
  t.timeout(100000);
  await rm(join(where, 'node_modules'), {
    recursive: true,
    force: true,
  });
  /* await ultraCore('i -w ./src/tests/fixtures/vite-project'); */
  await ultraCore(`i -w ${where}`);
  execSync('npm run build', {
    cwd: where,
  });
  t.pass();
});
