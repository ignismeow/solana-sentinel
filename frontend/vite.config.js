import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiBase = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_RESOLVED_API_URL': JSON.stringify(apiBase),
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['sentinelsol.live', 'www.sentinelsol.live', 'api.sentinelsol.live'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiBase,
        changeOrigin: true,
      },
    },
  },
});
