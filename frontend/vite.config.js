import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'manifest.webmanifest',
      strategies: 'generateSW',
      injectRegister: 'auto',
      includeAssets: ['vite.svg', 'robots.txt', 'logo.jpeg'],
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest,woff,woff2}'],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Gultraders',
        short_name: 'Gultraders',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'maskable.png',
            sizes: '196x196',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'logo.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
    {
      name: 'rewrite-pos',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/pos') && !req.url.includes('.')) {
            req.url = '/pos.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/storefront'),
      '@pos': path.resolve(__dirname, './src/pos'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        pos: path.resolve(__dirname, 'pos.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
