import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/chip8/',
  publicDir: path.resolve(__dirname, '../../assets'),
  resolve: {
    alias: {
      chip8_js: path.resolve(__dirname, '../src'),
      assets: path.resolve(__dirname, '../../assets'),
    },
  },
  build: {},
  assetsInclude: [/\.ch8?$/],
  server: {
    port: 3030,
    host: '0.0.0.0',
  },
});
