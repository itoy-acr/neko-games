import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const kaplayCongrats = () => {
  return {
    name: "vite-plugin-kaplay-hello",
    buildEnd() {
      const line = "---------------------------------------------------------";
      const msg = `🦖 Awesome pal! Send your game to us:\n\n💎 Discord: https://discord.com/invite/aQ6RuQm3TF \n💖 Donate to KAPLAY: https://opencollective.com/kaplay\n (you can disable this msg on vite.config)`;

      process.stdout.write(`\n${line}\n${msg}\n${line}\n`);
    },
  };
};

export default defineConfig({
  // If deploying under a subpath (e.g. GitLab Pages project path), set base:
  // base: "/<project-name>/",
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "apps/index.html"),
        featured: resolve(__dirname, "apps/featured/index.html"),
        "games/game-a": resolve(__dirname, "apps/games/game-a/index.html"),
        "games/game-b": resolve(__dirname, "apps/games/game-b/index.html"),
        "games/game-c": resolve(__dirname, "apps/games/game-c/index.html"),
        "games/game-d": resolve(__dirname, "apps/games/game-d/index.html"),
      },
    },
  },
  plugins: [
    tailwindcss(),
    // Disable messages removing this line
    kaplayCongrats(),
  ],
});
