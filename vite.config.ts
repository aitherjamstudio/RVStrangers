import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base ('./') allows bundle assets to resolve correctly both
  // on GitHub Pages (/RVStrangers/) and inside Capacitor Android WebView (http/https origin).
  // Can be overridden via VITE_BASE if desired.
  base: process.env.VITE_BASE || './',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  }
});
