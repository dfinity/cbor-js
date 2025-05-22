/// <reference types="vitest/config" />

import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig(({ mode }) => ({
  plugins: [
    checker({
      typescript: {
        tsconfigPath:
          mode === 'test' ? './tsconfig.test.json' : './tsconfig.json',
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      name: 'Cbor',
      fileName: 'cbor',
    },
    sourcemap: true,
    minify: true,
  },
}));
