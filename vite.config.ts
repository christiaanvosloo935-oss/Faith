import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths so the same build works at a domain root or under /Faith/ on GitHub Pages.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
} as never);
