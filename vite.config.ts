import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Split the heavy third-party libraries into their own chunks.
 *
 * Before this, a single 1.39 MB entry chunk held React, GSAP, framer-motion,
 * Supabase, Recharts and three.js together, so every student re-downloaded all
 * of it whenever any one of them changed. Splitting by library means a deploy
 * that only touches app code leaves the vendor chunks in the browser cache, and
 * the ones a given screen never needs (charts on the student side, three.js
 * after the intro) are simply never fetched.
 */
function vendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) return;
  // React and its renderer must stay in one chunk or the runtime breaks.
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return "vendor-react";
  if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) return "vendor-three";
  if (/[\\/]node_modules[\\/](gsap|@gsap)[\\/]/.test(id)) return "vendor-gsap";
  if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "vendor-motion";
  if (/[\\/]node_modules[\\/](recharts|d3-[a-z]+|victory-vendor)[\\/]/.test(id)) return "vendor-charts";
  if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return "vendor-supabase";
  if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "vendor-query";
  if (/[\\/]node_modules[\\/](@radix-ui|cmdk|vaul|embla-carousel[a-z-]*)[\\/]/.test(id)) return "vendor-radix";
  if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "vendor-icons";
  return "vendor";
}

export default defineConfig({
  server: {
    host: "::",
    port: Number(process.env.PORT) || 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The battle screen legitimately sits near 700 kB; warn only past that so
    // the signal stays meaningful instead of firing on every build.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
