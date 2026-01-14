import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // IMPORTANT:
  // - Website (including deep links like /shop, /english, /r/:code) needs an absolute base so assets load from /assets/*
  // - Native (Capacitor) builds need a relative base ('./') so bundled assets resolve inside the native container
  //
  // For native builds, run: CAPACITOR=true npm run build
  // (or: vite build --mode capacitor)
  const isCapacitorBuild =
    mode === "capacitor" ||
    process.env.CAPACITOR === "true" ||
    process.env.VITE_CAPACITOR === "true";

  return {
    base: isCapacitorBuild ? "./" : "/",
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      sourcemap: true, // Generate source maps and reference them for debugging
      cssCodeSplit: true, // Split CSS for better loading
      chunkSizeWarningLimit: 600, // Warn on larger chunks
      rollupOptions: {
        output: {
          // Ensure CSS is chunked for async loading
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "assets/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
          // Manual chunk splitting to reduce main bundle size
          manualChunks: (id) => {
            // Core React framework - loads immediately
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            // Router - also critical
            if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) {
              return 'router';
            }
            // State management
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            // Supabase - defer loading slightly
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            // Animation - can load async
            if (id.includes('framer-motion')) {
              return 'framer';
            }
            // UI components - split into separate chunk
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            // Capacitor plugins - only for native
            if (id.includes('@capacitor')) {
              return 'capacitor';
            }
            // Native app pages - separate chunk
            if (id.includes('/pages/app/')) {
              return 'native-app';
            }
          },
        },
      },
    },
    css: {
      devSourcemap: true,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

