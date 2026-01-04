import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['api/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  outDir: 'output',
  noExternal: ['@lab404/database', '@lab404/shared-types'],
  esbuildOptions(options) {
    options.alias = {
      '@lab404/database': '../../packages/database/dist/index.mjs',
      '@lab404/shared-types': '../../packages/shared-types/dist/index.mjs',
    };
  },
});
