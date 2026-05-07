import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: { overlay: false },
    watch: { usePolling: true, interval: 500 },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      stream: "stream-browserify",
      crypto: "crypto-browserify",
      buffer: "buffer",
      util: "util",
      // process/browser no longer exported in newer process package — use root
      process: "process",
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
    target: "es2020",
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("@solana/web3.js")) return "solana-web3";
          if (id.includes("@solana/spl-token")) return "solana-spl";
          if (id.includes("@coral-xyz/anchor")) return "anchor";
          if (id.includes("@solana/wallet-adapter")) return "wallet-adapter";
          if (id.includes("firebase/firestore")) return "firebase-firestore";
          if (id.includes("firebase/database")) return "firebase-rtdb";
          if (id.includes("firebase/auth")) return "firebase-auth";
          if (id.includes("firebase")) return "firebase-core";
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react-router-dom")) return "react-router";
          if (id.includes("framer-motion")) return "framer";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "lucide";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
});