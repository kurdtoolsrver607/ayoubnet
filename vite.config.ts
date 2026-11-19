import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function staticTradingRoute(): Plugin {
  return {
    name: 'static-trading-route',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanPath = (req.url || '').split('?')[0];
        if (cleanPath === '/trading' || cleanPath === '/trading/' || cleanPath === '/trading/index.html') {
          const htmlPath = path.resolve(process.cwd(), 'trading/index.html');
          if (fs.existsSync(htmlPath)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(fs.readFileSync(htmlPath, 'utf-8'));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), staticTradingRoute()],
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
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
