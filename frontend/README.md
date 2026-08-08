# Frontend

Lyrebird's Vite + React + TypeScript + Tailwind v4 app — the marketing landing page and the React Flow dashboard in one codebase. See the [root README](../README.md) for the full picture.

## What lives here

- `src/components/` — landing sections (Nav, Hero with animated chat, HowItWorks, Safety, Pricing, FAQ, CTA, Footer) + shared bits (Logo, Reveal)
- `src/components/dashboard/` — DashboardHeader, Modal, SystemMap (React Flow graph of a service's endpoints), BotFatherGuide
- `src/pages/` — Dashboard (tenant list) and TenantDetail (services + map), `React.lazy`-loaded so the landing bundle stays lean
- `src/api/client.ts` — axios instance + typed endpoints; base URL from `VITE_API_BASE_URL`
- `src/lib/` — helpers (spec counting, token masking, theme persistence)
- `src/index.css` — the brand system as Tailwind v4 `@theme` tokens (warm editorial: paper/ink/coral/leaf), dark mode pairs, keyframes

## Running

```bash
yarn install
yarn dev        # http://localhost:5173 (talks to the backend on :3000)
```

## Checks

```bash
yarn build      # tsc -b + vite build
yarn lint       # oxlint
```

Routes: `/` (landing), `/app` (dashboard), `/app/tenants/:tenantId` (service detail + map). Optional `VITE_API_BASE_URL` overrides the API origin (default `http://localhost:3000`); the admin API key lives in `localStorage['lyrebird_admin_key']`, editable in the dashboard header.
