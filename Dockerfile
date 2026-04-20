FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY package.json ./
COPY tsconfig.json tsconfig.base.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/journal-search/package.json ./artifacts/journal-search/

RUN pnpm install --frozen-lockfile

COPY artifacts/ ./artifacts/

RUN BASE_PATH=/ pnpm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=base /app/artifacts/api-server/dist/ ./artifacts/api-server/dist/
COPY --from=base /app/artifacts/journal-search/dist/ ./artifacts/journal-search/dist/

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
