import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  target: 'es2020',
  shims: false,
  splitting: false,
  minify: false,
  tsconfig: 'tsconfig.build.json',
});