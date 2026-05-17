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
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. PDF Generation libraries (split to keep each under 500kB)
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('pdf-lib')) {
              return 'vendor-pdflib';
            }
            if (id.includes('jszip')) {
              return 'vendor-jszip';
            }
            
            // 2. Charts (heavy)
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            
            // 3. Heavy scanning/barcode tools
            if (id.includes('html5-qrcode') || id.includes('jsbarcode')) {
              return 'vendor-scanner';
            }
            
            // 4. Large Icon Library
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // 5. Rich Text Editor
            if (id.includes('react-quill') || id.includes('quill')) {
              return 'vendor-editor';
            }

            // 6. UI & Styling Frameworks
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('@headlessui')) {
              return 'vendor-headlessui';
            }
            if (id.includes('framer-motion') || id.includes('motion')) {
              return 'vendor-motion';
            }

            // 7. Core React framework (specific matching to avoid grouping other React utilities)
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            // 8. Router
            if (id.includes('react-router') || id.includes('@remix-run')) {
              return 'vendor-router';
            }

            // 9. State & Queries
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            
            // 10. Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
          }
        }
      }
    }
  }
});
