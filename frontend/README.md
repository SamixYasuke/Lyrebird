# Frontend

Lyrebird's Vite + React + TypeScript + Tailwind v4 app — the marketing landing page and the React Flow dashboard in one codebase. See the [root README](../README.md) for the full picture.

## What lives here

- `src/components/` — landing sections (Nav, Hero with animated chat, HowItWorks, Safety, Pricing, FAQ, CTA, Footer) + shared bits (Logo, Reveal)
- `src/components/auth/` — RequireAuth (route guard)
- `src/components/dashboard/` — DashboardHeader, Modal, SystemMap (React Flow graph of a service's endpoints), BotFatherGuide
- `src/store/` — zustand stores (auth: JWT session state)
- `src/pages/` — Auth (login/signup at `/auth`), Dashboard (workspace), and TenantDetail (services + map), `React.lazy`-loaded so the landing bundle stays lean
- `src/api/client.ts` — axios instance + typed endpoints (authApi, tenantsApi); base URL from `VITE_API_BASE_URL`, sends `Authorization: Bearer <token>`
- `src/lib/` — helpers (auth token storage, spec counting, token masking, theme persistence)
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

Routes: `/` (landing), `/auth` (sign up / sign in), `/app` (workspace), `/app/tenants/:tenantId` (service detail + map). Optional `VITE_API_BASE_URL` overrides the API origin (default `http://localhost:3000`). The console is JWT-based: sign in at `/auth`, the session (token + user + tenant) lives in `localStorage['lyrebird_auth']` (zustand store in `src/store/auth.ts`), `/app*` is guarded by `RequireAuth`, and a 401 from the API clears the session and returns you to `/auth`.
