# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Open Access Journal Search (`artifacts/journal-search`)
- React + Vite frontend-only app (no backend needed)
- Academic library branding with dark blue header, white background, blue accents
- Keyword search + sidebar filters: source, year range, language, license
- Result cards with title, authors, journal, year, DOI, source, license badge, "Open at source" button
- All external links open in new tab; no iframes
- Mock data in `src/data/mockArticles.ts` — swap `searchArticles` in `src/lib/search.ts` for real API integration

## Version Control

- **GitHub remote**: `https://github.com/drhandoko/perpustakaan-umt.git` (remote name: `origin`)
- **Branch**: `main` (tracking `origin/main`)
- **Authentication**: GitHub OAuth integration (`github:1.0.0` in `.replit`)
- **Push status**: All commits pushed; branch is in sync with remote

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
