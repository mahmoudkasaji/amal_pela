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
    // Chunk splitting strategy (conservative — avoids React init-order bugs):
    //
    // Rule: anything that depends on React (directly or transitively) stays
    // in ONE chunk with React itself. This prevents the classic
    // "Cannot read properties of undefined (reading 'PureComponent')" bug
    // where a React-dependent library evaluates before React is defined.
    //
    // Only *fully standalone* packages (no React dependency) get their own
    // chunk. `charts` (recharts) is React-based but is big + lazy-loaded only
    // on Reports page, so splitting it is safe because by the time it loads,
    // the main vendor chunk (with React) is already evaluated.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;

          // Standalone packages (no React) — safe to split for caching
          if (id.includes('@supabase/')) return 'supabase';
          if (id.includes('date-fns')) return 'date';

          // Large React-based lib that's lazy-loaded only on Reports page
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';

          // EVERYTHING ELSE (React + all React-based UI libs) — single vendor
          // chunk. This includes: react, react-dom, react-router, radix,
          // lucide-react, motion, sonner, vaul, cmdk, react-day-picker,
          // react-hook-form, react-resizable-panels, input-otp, next-themes,
          // embla-carousel-react, clsx, tailwind-merge, cva, tw-animate-css,
          // zustand, etc.
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
