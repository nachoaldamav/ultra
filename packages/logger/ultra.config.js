import config from '@ultrapkg/compiler';

export default config({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  minify: false,
  color: true,
  sourcemap: true,
  target: 'es2019',
  format: 'esm',
  platform: 'node',
});
