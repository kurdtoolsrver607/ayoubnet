import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function tradingRouteMiddleware(): Plugin {
  return {
    name: 'trading-isolated-route',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const cleanPath = (req.url || '').split('?')[0];
        if (cleanPath === '/trading' || cleanPath === '/trading/' || cleanPath === '/trading/index.html') {
          try {
            const htmlPath = path.resolve(process.cwd(), 'trading/index.html');
            const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
            const transformed = await server.transformIndexHtml(req.url || '/trading', rawHtml);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(transformed);
            return;
          } catch (err) {
            next(err);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tradingRouteMiddleware()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        app: './src/main.tsx',
        trading: './src/trading/main.tsx',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'TradingApp.css' || assetInfo.name === 'trading.css') {
            return 'assets/trading.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
});
