import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function tradingRouteMiddleware(): Plugin {
  return {
    name: 'trading-isolated-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/trading' || req.url?.startsWith('/trading?')) {
          req.url = '/trading/index.html';
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
