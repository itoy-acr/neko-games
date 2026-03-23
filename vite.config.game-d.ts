import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  root: resolve(__dirname, "apps/featured"),
  publicDir: false,
  build: {
    outDir: resolve(__dirname, "dist-game-d"),
    emptyOutDir: true,
    assetsInlineLimit: 2 * 1024 * 1024,
  },
});
