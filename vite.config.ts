import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://sjwin92.github.io/scripter/
// Set GITHUB_PAGES=true for that production build (deploy-pages.yml does this).
// Local `npm run dev` and `npm run build` stay at `/`.
const pages = process.env.GITHUB_PAGES === "true";

function githubPagesSpaFallback() {
  return {
    name: "github-pages-spa-fallback",
    closeBundle() {
      const index = resolve("dist/index.html");
      if (existsSync(index)) {
        copyFileSync(index, resolve("dist/404.html"));
      }
    },
  };
}

export default defineConfig({
  base: pages ? "/scripter/" : "/",
  plugins: [react(), githubPagesSpaFallback()],
  test: {
    environment: "node",
  },
  server: {
    host: true,
    port: 5173,
  },
});
