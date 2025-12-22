import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Production optimizations
    sourcemap: false, // Disable sourcemaps in production for security
    minify: 'esbuild', // Use esbuild for faster minification

    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', 'lucide-react', 'react-hot-toast'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils': ['axios', 'zustand', 'date-fns', 'clsx'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 600,
  },

  server: {
    port: 3000,
    strictPort: false,
    open: true,
  },

  preview: {
    port: 3000,
    strictPort: false,
  },
})
