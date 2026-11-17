import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_error, _request, response) => {
            if (response.writableEnded) return;
            response.statusCode = 503;
            response.setHeader('Content-Type', 'application/json');
            response.end(
              JSON.stringify({
                success: false,
                error: {
                  code: 'API_UNAVAILABLE',
                  message:
                    'The API server is not reachable. Start the backend and check MongoDB connectivity.',
                },
              }),
            );
          });
        },
      },
    },
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    restoreMocks: true,
  },
});
