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
  external: [
    'isomorphic-dompurify',
    'dompurify',
    'jsdom',
    '@exodus/bytes',
    'html-encoding-sniffer',
  ],
});
