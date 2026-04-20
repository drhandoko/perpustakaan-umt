# Perpustakaan Universitas Murni Teguh — Open Access Discovery Portal

A discovery portal for open-access scholarly content, built for the library of Universitas Murni Teguh. Users can search for **journals**, **books**, and **articles** across multiple open-access indexes and apply filters by subject, language, and quality ranking.

---

## Is this a static site or a backend app?

**This is a full-stack app — it requires a Node.js backend.**

It cannot be deployed as a static site (no S3 / GitHub Pages / Vercel static hosting). The backend is required because:

| Feature | Why the backend is needed |
|---|---|
| Books search | Proxies DOAB + OAPEN — CORS blocks direct browser access |
| Journals search | Proxies DOAJ and enriches results with OpenAlex JIF quartile rankings — all server-side |
| Future sources | Any additional data sources that lack open CORS headers |

The frontend (React SPA) and the API (Express) are served from the **same Node.js process on the same port** in production — no nginx or reverse proxy is required for a basic deployment.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js (v20+), Express 5 |
| Package manager | pnpm (v9+) |
| Data sources | DOAJ, DOAB, OAPEN, Crossref, OpenAlex |
| Build output | `artifacts/journal-search/dist/public/` (frontend) · `artifacts/api-server/dist/index.mjs` (backend) |

---

## Requirements

- **Node.js** v20 or later
- **pnpm** v9 or later (`npm install -g pnpm`)
- Internet access from the server (the backend calls DOAJ, DOAB, OAPEN, Crossref, and OpenAlex APIs)
- A single open port (default: `3000`)

---

## Quickstart (local machine or VPS)

```bash
# 1. Clone the repository
git clone <your-repo-url> perpustakaan
cd perpustakaan

# 2. Install dependencies
pnpm install

# 3. Copy the example environment file and edit as needed
cp .env.example .env

# 4. Build for production (frontend + backend)
pnpm run build

# 5. Start the server (defaults to port 3000)
PORT=3000 pnpm run start
```

Then open `http://your-server:3000` in a browser.

---

## Environment variables

All variables have sensible defaults. Only `PORT` is commonly changed.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `NODE_ENV` | (unset) | Set to `production` in live deployments |
| `BASE_PATH` | `/` | URL base for the React app (see sub-path deployment below) |
| `STATIC_DIR` | `artifacts/journal-search/dist/public` | Override if you move built files elsewhere |

---

## Deployment scenarios

### Option 1 — Single server (simplest)

The built-in static serving means a single `node` process handles everything.

```bash
# 1. Build
pnpm run build

# 2. Start (defaults to port 3000; set PORT to override)
PORT=3000 pnpm run start
```

Use **PM2** to keep the process alive across reboots:

```bash
npm install -g pm2
PORT=3000 NODE_ENV=production pm2 start artifacts/api-server/dist/index.mjs \
  --name perpustakaan
pm2 save
pm2 startup   # follow the printed instructions to enable autostart
```

---

### Option 2 — Nginx reverse proxy (recommended for campus servers)

If your campus already runs nginx and you want to put the app behind an existing web server:

```nginx
# /etc/nginx/sites-available/perpustakaan
server {
    listen 80;
    server_name lib.example.ac.id;

    # Forward all traffic to the Node.js process
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade          $http_upgrade;
        proxy_set_header   Connection       keep-alive;
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: let nginx serve static assets directly for better performance
    location /assets/ {
        alias /var/www/perpustakaan/artifacts/journal-search/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/perpustakaan /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

### Option 3 — Sub-path deployment

If the portal must live at a sub-path of an existing site (e.g. `https://www.example.ac.id/library/`):

```bash
# Build with the sub-path as BASE_PATH (must end with /)
BASE_PATH=/library/ pnpm run build

# Start with the same port
PORT=3000 pnpm run start
```

In nginx, proxy only the `/library/` location:

```nginx
location /library/ {
    proxy_pass http://127.0.0.1:3000/;
    # ... same proxy headers as Option 2
}
```

---

### Option 4 — Docker

A `Dockerfile` is included at the root of the repository. Build and run it:

```bash
docker build -t perpustakaan .
docker run -d -p 3000:3000 --env PORT=3000 --name perpustakaan perpustakaan
```

To override the port:

```bash
docker run -d -p 8080:8080 --env PORT=8080 --name perpustakaan perpustakaan
```

---

## Development (local)

```bash
pnpm install

# Start the API backend (port 8080)
pnpm --filter @workspace/api-server run dev &

# Start the Vite frontend (proxies /api/* to port 8080)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/journal-search run dev
```

The frontend dev server is at `http://localhost:5173`.

---

## Project structure

```
.
├── artifacts/
│   ├── api-server/              Express backend
│   │   ├── src/
│   │   │   ├── app.ts           Express app (CORS, static serving, routes)
│   │   │   ├── index.ts         Server entry point (reads PORT)
│   │   │   ├── routes/
│   │   │   │   ├── booksSearch.ts      GET /api/books-search
│   │   │   │   ├── journalsSearch.ts   GET /api/journals-search
│   │   │   │   ├── doabSearch.ts       GET /api/doab-search (legacy)
│   │   │   │   └── health.ts           GET /api/healthz
│   │   │   └── lib/
│   │   │       ├── books/       DOAB + OAPEN fetchers & deduplication
│   │   │       └── ranking/     OpenAlex batch enricher + quartile mapper
│   │   └── dist/                Production bundle (after build:prod)
│   │       └── index.mjs
│   └── journal-search/          React + Vite frontend
│       ├── src/
│       │   ├── pages/SearchPage.tsx
│       │   ├── components/
│       │   ├── lib/             API clients, filters, normalisation
│       │   └── data/            Shared types and filter constants
│       └── dist/public/         Production static files (after build:prod)
│           ├── index.html
│           └── assets/
├── lib/                         Shared TypeScript libraries
├── .env.example                 Environment variable template
├── package.json                 Root scripts (build:prod, start:prod)
└── pnpm-workspace.yaml
```

---

## API endpoints

All endpoints are at `/api/*` and return JSON.

| Endpoint | Description |
|---|---|
| `GET /api/healthz` | Health check — returns `{"status":"ok"}` |
| `GET /api/journals-search?q=&page=&pageSize=` | DOAJ journals enriched with OpenAlex JIF quartile |
| `GET /api/books-search?q=&sources=doab,oapen&limit=&offset=` | DOAB + OAPEN books, deduplicated |
| `GET /api/doab-search` | Legacy DOAB-only endpoint (kept for compatibility) |

---

## Data sources

| Source | Content | Access |
|---|---|---|
| [DOAJ](https://doaj.org) | Journals | Free, public API |
| [DOAB](https://www.doabooks.org) | Open-access books | Free, public API |
| [OAPEN](https://oapen.org) | Open-access books | Free, public API |
| [Crossref](https://crossref.org) | Scholarly articles | Free, public API |
| [OpenAlex](https://openalex.org) | Journal quality tiers (JIF) | Free, public API, no key needed |

No API keys are required. All sources are publicly accessible. The server makes outbound HTTPS requests to these services on behalf of each search query.

---

## Journal quality tiers

Journals are enriched with quality tiers derived from OpenAlex's 2-year mean citedness (Journal Impact Factor). Tiers are labelled "Q1 (OpenAlex-based)" etc. on each journal card.

| Tier | JIF threshold | Badge colour |
|---|---|---|
| Q1 — Top 25% | ≥ 2.5 | Emerald |
| Q2 — Upper mid | 0.70 – 2.49 | Sky blue |
| Q3 — Lower mid | 0.12 – 0.69 | Amber |
| Q4 — Bottom 25% | 0.01 – 0.11 | Rose |
| Unranked | Not found in OpenAlex | Gray |

> **Note:** These are indicative tiers, not official SJR (Scimago) quartiles. Scimago does not provide a public API; OpenAlex JIF is the closest freely available proxy and is labelled clearly on every card.

---

## Firewall / network requirements

The server must be able to make outbound HTTPS (port 443) requests to:

- `doaj.org`
- `doabooks.org`
- `oapen.org`
- `api.crossref.org`
- `api.openalex.org`

No inbound rules are needed beyond the application port (default 3000).

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Blank page after deployment | `BASE_PATH` mismatch | Ensure `BASE_PATH` matches the URL path you deployed to |
| `Static directory not found` warning | `build` not run yet | Run `pnpm run build` before starting |
| Server starts on wrong port | `PORT` env var not set | Add `PORT=3000` before the start command |
| Journal quartiles all "Unranked" | Outbound to `api.openalex.org` blocked | Allow outbound HTTPS from the server to `api.openalex.org` |
| Books search returns nothing | Outbound to DOAB/OAPEN blocked | Allow outbound HTTPS to `doabooks.org` and `oapen.org` |

---

## Updating the app

```bash
git pull
pnpm install        # pick up any new dependencies
pnpm run build      # rebuild frontend + backend
pm2 restart perpustakaan   # or: PORT=3000 pnpm run start
```
