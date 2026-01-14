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
          manualChunks: {
            // Core React framework
            "react-vendor": ["react", "react-dom"],
            // Router
            router: ["react-router-dom"],
            // State management and data fetching
            query: ["@tanstack/react-query"],
            // UI components library
            radix: [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-tabs",
              "@radix-ui/react-toast",
              "@radix-ui/react-tooltip",
            ],
            // Animation library
            framer: ["framer-motion"],
            // Supabase client
            supabase: ["@supabase/supabase-js"],
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

