import { defineConfig } from 'vite';

// base 使用相對路徑，部署到 GitHub Pages 子路徑（/<repo>/）也能正確載入
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
  server: { port: 5173, host: true },
});
