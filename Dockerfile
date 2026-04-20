FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests first so pnpm can resolve the full package graph
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY package.json tsconfig.json tsconfig.base.json ./

# Copy every package.json in the workspace (needed for pnpm install)
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json         ./lib/api-spec/
COPY lib/api-zod/package.json          ./lib/api-zod/
COPY lib/db/package.json               ./lib/db/
COPY artifacts/api-server/package.json     ./artifacts/api-server/
COPY artifacts/journal-search/package.json ./artifacts/journal-search/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/ 2>/dev/null || true

# Install all dependencies (uses frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Copy full source after install to benefit from Docker layer cache
COPY lib/       ./lib/
COPY artifacts/ ./artifacts/

# Build frontend (React/Vite) then backend (Express/esbuild)
RUN BASE_PATH=/ pnpm run build

# ── Runtime image ─────────────────────────────────────────────────────────────
# Copy only the compiled outputs — no source, no dev dependencies, no tooling.
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=base /app/artifacts/api-server/dist/     ./artifacts/api-server/dist/
COPY --from=base /app/artifacts/journal-search/dist/ ./artifacts/journal-search/dist/

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/healthz || exit 1

CMD ["node", "artifacts/api-server/dist/index.mjs"]
