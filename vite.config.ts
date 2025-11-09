import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true, // ✅ Ensures clean builds (avoids stale dist issues)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'), // ✅ optional alias for cleaner imports
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // backend for local dev
        changeOrigin: true,
        secure: false,
        // ✅ optional: keep path as /api for backend
        // rewrite: (path) => path.replace(/^\/api/, ''), // uncomment only if backend doesn’t use /api prefix
      },
    },
  },
});