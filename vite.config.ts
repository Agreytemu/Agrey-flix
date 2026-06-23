import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Read secrets from environment at build time
  const tmdbKey = process.env.VITE_TMDB_API || process.env.TMDB_API_KEY || 'aba5f8fd0af9ee2361ec8a38ac078c57';
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://vidsrcscraper-production.up.railway.app';
  const tmdbBearer = process.env.VITE_TMDB_BEARER_TOKEN || process.env.TMDB_BEARER_TOKEN || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_TMDB_API': JSON.stringify(tmdbKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_TMDB_BEARER_TOKEN': JSON.stringify(tmdbBearer),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
