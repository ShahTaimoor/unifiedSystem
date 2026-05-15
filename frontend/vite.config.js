import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logo.jpeg'],
      manifest: {
        name: 'Unified POS & Storefront',
        short_name: 'UnifiedSystem',
        description: 'Complete POS and E-commerce solution',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@pos': path.resolve(__dirname, './src/pos'),
      '@sf': path.resolve(__dirname, './src/storefront'),
      '@/components': path.resolve(__dirname, './src/pos/components'),
      '@/hooks': path.resolve(__dirname, './src/pos/hooks'),
      '@/utils': path.resolve(__dirname, './src/pos/utils'),
      '@/store': path.resolve(__dirname, './src/pos/store'),
      '@/services': path.resolve(__dirname, './src/pos/services'),
      '@/contexts': path.resolve(__dirname, './src/pos/contexts'),
      '@/features': path.resolve(__dirname, './src/pos/features'),
      '@/pages': path.resolve(__dirname, './src/pos/pages'),
      '@/config': path.resolve(__dirname, './src/pos/config'),
      '@/lib': path.resolve(__dirname, './src/pos/lib'),
      '@/i18n': path.resolve(__dirname, './src/pos/i18n'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: true,
    sourcemap: false
  }
});
