import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Changes on every build. The app compares its own copy with the published
// version.json to notice when a newer version is live.
const BUILD_ID = String(Date.now());

export default defineConfig({
  // Relative paths so the same build works at a domain root or under /Faith/ on GitHub Pages.
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'faith-version-file',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
      },
    },
  ],
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
} as never);
