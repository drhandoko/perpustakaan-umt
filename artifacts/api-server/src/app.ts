import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API routes ───────────────────────────────────────────────────────────────

app.use("/api", router);

// ─── Static file serving (production only) ────────────────────────────────────
//
// In production, Express serves the pre-built React frontend so that only a
// single Node.js process is needed on the server.
//
// STATIC_DIR  — path to the Vite build output directory.
//               Override this env var when you place the built files somewhere
//               other than the default monorepo location.
//               Default: ../../journal-search/dist/public  (relative to this
//               file's bundle location, i.e. artifacts/api-server/dist/)

if (isProduction) {
  const thisDir = resolve(fileURLToPath(import.meta.url), "..");
  const staticDir =
    process.env.STATIC_DIR ??
    resolve(thisDir, "../../journal-search/dist/public");

  if (!existsSync(staticDir)) {
    logger.warn(
      { staticDir },
      "Static directory not found — frontend will not be served. " +
        "Run `pnpm run build:prod` from the project root first, or set the " +
        "STATIC_DIR environment variable to the correct path.",
    );
  } else {
    logger.info({ staticDir }, "Serving static frontend from");

    // Serve hashed asset files with long-lived cache headers.
    app.use(
      "/assets",
      express.static(resolve(staticDir, "assets"), {
        maxAge: "1y",
        immutable: true,
      }),
    );

    // Serve all other static files (favicon, manifest, etc.) with short cache.
    app.use(express.static(staticDir, { maxAge: "1h" }));

    // SPA fallback — any non-API request that didn't match a static file
    // gets index.html so React's client-side router can take over.
    // Using app.use (no path arg) avoids Express 5's stricter wildcard rules.
    app.use((_req, res) => {
      res.sendFile(resolve(staticDir, "index.html"));
    });
  }
}

export default app;
