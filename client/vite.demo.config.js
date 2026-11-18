import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const demoApiTarget = process.env.DEMO_API_TARGET ?? 'http://127.0.0.1:5002';

export default defineConfig({
  mode: 'demo',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1'),
  },
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: demoApiTarget,
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
                  code: 'DEMO_API_UNAVAILABLE',
                  message: 'The demo API is not reachable. Start it with npm run demo.',
                },
              }),
            );
          });
        },
      },
    },
  },
  preview: {
    port: 4175,
  },
});
