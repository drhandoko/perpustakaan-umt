import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// ─── Environment ──────────────────────────────────────────────────────────────
// PORT   — dev server port.  Defaults to 5173 (Vite default) when not set.
//          Required when running on Replit (set automatically by the platform).
// BASE_PATH — URL base for the app (e.g. "/" or "/library/").
//             Defaults to "/" so the app works at a domain root without config.
//             Must end with "/" when set to a sub-path.

const isProduction = process.env.NODE_ENV === "production";
const onReplit = process.env.REPL_ID !== undefined;

// PORT is only needed for the dev server; ignore it during production builds.
let port = 5173;
if (!isProduction) {
  const rawPort = process.env.PORT;
  if (onReplit && !rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  if (rawPort) {
    port = Number(rawPort);
    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
  }
}

// BASE_PATH drives Vite's `base` option.  "/" works for root deployments.
const basePath = process.env.BASE_PATH ?? "/";

// ─── Plugins ──────────────────────────────────────────────────────────────────

const replitPlugins =
  !isProduction && onReplit
    ? await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
        import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
        ),
        import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
      ])
    : [];

// ─── Config ───────────────────────────────────────────────────────────────────

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // In development, proxy /api/* to the Express backend so the browser never
    // needs to talk to it directly.  In production Express serves both API and
    // static files on the same port — no proxy needed.
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 8080}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
