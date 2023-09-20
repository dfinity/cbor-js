import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [checker({ typescript: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      name: 'Cbor',
      fileName: 'cbor',
    },
    sourcemap: true,
    minify: true,
  },
});
