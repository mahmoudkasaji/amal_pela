import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    // Split heavy dependencies into separate chunks for better caching
    // and smaller initial bundle.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // React core
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router/')) {
            return 'react-vendor';
          }
          // Supabase
          if (id.includes('@supabase/')) return 'supabase';
          // Charts (recharts + d3)
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          // All Radix UI primitives share a chunk
          if (id.includes('@radix-ui/')) return 'radix';
          // Forms
          if (id.includes('react-hook-form')) return 'forms';
          // Dates
          if (id.includes('date-fns')) return 'date';
          // Motion/animation
          if (id.includes('motion') || id.includes('framer-motion')) return 'motion';
          // Icons
          if (id.includes('lucide-react')) return 'icons';
          // Everything else from node_modules
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
