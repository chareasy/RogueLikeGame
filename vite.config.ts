import { defineConfig } from 'vite';

export default defineConfig({
  // Project Pages: https://chareasy.github.io/RogueLikeGame/
  base: '/RogueLikeGame/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2022',
  },
});
