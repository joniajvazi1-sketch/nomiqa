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
      sourcemap: true,
      cssCodeSplit: true,
      // Reduce chunk size for faster mobile parsing
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "assets/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
          // Optimized chunk splitting for mobile
          manualChunks: (id) => {
            // Core React - smallest possible
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("node_modules/react/")) return "react-core";
            // Router - separate for code splitting
            if (id.includes("react-router")) return "router";
            // Query client
            if (id.includes("@tanstack/react-query")) return "query";
            // Radix UI - split into smaller chunks
            if (id.includes("@radix-ui")) return "radix";
            // Framer Motion - only load when needed (lazy via AppLayout)
            if (id.includes("framer-motion")) return "framer";
            // Supabase - defer until auth/data needed
            if (id.includes("@supabase")) return "supabase";
            // Sentry - load last
            if (id.includes("@sentry")) return "sentry";
            // Lucide icons
            if (id.includes("lucide-react")) return "icons";
            // Three.js / R3F - MASSIVE, only for globe (lazy loaded)
            if (id.includes("three") || id.includes("@react-three")) return "three-globe";
            // Recharts - only for stats pages
            if (id.includes("recharts")) return "recharts";
            // Leaflet - only for map page
            if (id.includes("leaflet")) return "leaflet";
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

