import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  splitting: true,
  dts: true,
  outDir: 'dist',
  format: 'esm',
  skipNodeModulesBundle: true,
  outExtension() {
    return {
      js: `.js`,
    };
  },
});
