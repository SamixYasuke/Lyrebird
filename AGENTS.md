# AGENTS.md — Project Brainbox

Living knowledge base for this project. Keep this updated as decisions are made. This file is for agents (and humans) working on the codebase — it captures the "why" behind the structure, not just the "what".

## What we're building

A SaaS that automates building **Telegram bots** (WhatsApp later) for companies. A company connects their existing product API (base URL + OpenAPI/Swagger spec) and their end users can then operate the product in natural language through a Telegram bot.

- End user: "Check my order status" → bot calls the company's API → replies with the answer.
- End user: "Cancel my subscription" → bot confirms, then calls the company's API.

Core idea: the LLM discovers a company's API capabilities dynamically by being given the tool definitions parsed from their OpenAPI spec. No per-company coding — it's data-driven.

## Tech stack

| Concern | Choice |
| --- | --- |
| Backend framework | NestJS (TypeScript) |
| LLM provider | OpenRouter (free tier first; model must be validated for tool-calling) |
| Database | PostgreSQL |
| Cache / session store | Redis |
| Job queue | BullMQ |
| Frontend | Vite + React + TS + **Tailwind v4** (`@tailwindcss/vite`, CSS-based `@theme`) — landing page + React Flow dashboard in one codebase. Router: `react-router-dom` (BrowserRouter). HTTP: `axios`. Graph: `@xyflow/react` |
| Package manager | **yarn** (v1) — never npm |

## Monorepo structure

```
unnamed/
├── AGENTS.md    # living knowledge base for the project — agents (and humans) should read this first
├── README.md    # human-facing: what Lyrebird is, how to run it, API + security summary
├── backend/    # NestJS API + workers
│   └── src/
│       ├── config/       # env validation (class-validator)
│       ├── database/     # TypeORM module (Postgres) — `DATABASE_URL` or host/port, `DB_SYNCHRONIZE` (default true in dev), `DB_SSL` for Neon/Supabase
│       ├── redis/        # @Global() module providing REDIS_CLIENT (ioredis) — `REDIS_URL` (rediss:// TLS) or host/port via redis-config.ts
│       ├── queues/       # BullMQ: forRootAsync + telegram-updates queue (same redis-config helper)
│       ├── auth/         # JWT auth: UserEntity, signup/login/me, JwtAuthGuard, CurrentUser decorator, scrypt hashing
│       ├── tenants/      # TenantEntity + ServiceEntity, onboarding API (JwtAuthGuard-protected, per-user ownership scoping)
│       ├── agents/       # agent-tool.ts, agent.types.ts, openapi-parser, llm, tool-executor, agent-loop, tool-provider (agents.module)
│       ├── security/     # CryptoService (AES-256-GCM at rest for tenant credentials), SecurityModule
│       ├── sessions/     # SessionService (Redis history + LLM summary, token budget, pending confirmations)
│       ├── mock/         # dev-only mock company APIs (store/stream/dispatch) for end-to-end testing
│       └── telegram/     # webhook controller, route-by-token service, BullMQ processor, telegram-api (getMe/setWebhook/sendMessage)
└── frontend/   # Vite + React + TS + Tailwind v4 — landing page + React Flow dashboard
    └── src/
        ├── components/   # landing sections + Logo/Reveal etc.
        ├── components/auth/  # RequireAuth (route guard for /app*)
        ├── components/dashboard/  # DashboardHeader, Modal, SystemMap (React Flow graph)
        ├── store/        # zustand stores — auth.ts (JWT session state + login/signup/logout/hydrate)
        ├── pages/        # Auth (sign in / create account at /auth), Dashboard (workspace), TenantDetail (services + map)
        ├── api/client.ts # axios instance + typed endpoints (authApi, tenantsApi) + getApiError
        └── lib/          # auth.ts (token storage), spec.ts (countEndpoints/hostOf/maskToken), theme.ts
```

## Brand (locked 2026-08-08)

- **Name: Lyrebird** — the mimic bird. Concept: "give your product a voice" / turn an API into conversation.
- **Visual direction — "warm editorial"**: ivory paper `#FAF7F0`, deep ink `#16181D`, coral accent `#FF4D2E`, "reply" green `#1FAF7A`, plus derived mint `#9BE8C8`, ink-soft `#6B6556`, line `#E6DFCD`, paper-2 `#F1EBDD`, cream `#FFFCF5`, code bg `#1C1E26`. Theme tokens live in `frontend/src/index.css` via Tailwind v4 `@theme` → utilities like `bg-paper`, `text-coral`, `font-display`.
- **Typography**: Fraunces (serif display, `SOFT`/`WONK` axes — `.font-warm` sets `SOFT 90`) + Instrument Sans (body) + Geist Mono (endpoints/eyebrows). Loaded from Google Fonts in `index.html`.
- **Dark mode**: every color token in `frontend/src/index.css` `@theme` has a paired `dark:` value (ink↔paper, paper-2↔ink-deep, line↔line, cream→cream-solid = `#FFFCF5` fixed, mint↔`#9BE8C8` fixed, coral/leaf fixed). Tokens that invert are `bg-paper`, `bg-cream`, `bg-paper-2`, `border-line`, `text-ink`, `text-ink-soft`. Do **not** put `bg-ink`/`text-paper`/`text-cream` on dark-inverted surfaces (ink turns light in dark mode) — use `bg-ink-deep`/`text-cream-solid` instead. Toggle lives in `src/components/ThemeToggle.tsx`, wired into `Nav` (desktop cluster + mobile menu) and `DashboardHeader`; a tiny inline script in `index.html` applies the saved theme to `<html class="dark">` before paint to avoid a flash. **ThemeToggle must call `setTheme` (writes `lyrebird_theme` to localStorage) — never `applyTheme` directly, which only flips the class and makes the choice reset on refresh (fixed 2026-08-08).** `lib/theme.ts` = `getTheme`/`applyTheme`/`setTheme`.
- **Motion language**: staggered `rise`/`pop` keyframes for hero chat, IntersectionObserver `Reveal` wrapper for scroll-in, infinite endpoint `marquee`, subtle grain overlay (`body::after`, opacity 0.04), floating chat card.
- **Voice**: warm, direct, a little witty. Concrete words, no "revolutionize/supercharge" filler. Pricing tiers are bird names: Songbird (free), Starling ($49), Lyrebird Studio (custom).
- Logo: ink rounded-square mark, coral chat bubble with tail, mint "lyrebird feather" arc, three typing dots (`frontend/src/components/Logo.tsx`).

## Domain model (multi-tenancy)

Three distinct levels — never confuse them:

- **Tenant** = the company (our SaaS customer) that connects their API. `tenant_id` namespaces everything.
- **Service / Integration** = one API connection owned by a tenant: its base URL, auth, OpenAPI spec, and its own Telegram bot. One tenant can have many services.
- **End user** = the person texting the Telegram bot. `chat_id` from Telegram.

Key rules:
- The **Telegram bot token is the routing key**: webhook → bot token → service → tenant. Keeps routing trivial, no intent-routing needed.
- For MVP: **one bot per service** (1:1 bot token ↔ service). No bot routing to multiple services.
- Namespacing: sessions keyed `session:{tenantId}:{serviceId}:{chatId}`; Redis keys and DB rows prefixed by tenant/service.
- Trust boundary: LLM can only call the injected service endpoints, never internal ones.

## Core algorithms

### 1. OpenAPI → agent tools (bootstrap)
- Parse spec (JSON/YAML), resolve `$ref`s via `@apidevtools/swagger-parser`. `yaml.parse` handles both JSON and YAML input.
- One tool per path+method: name, description, param JSON schema (from `parameters` + `requestBody`).
- Tool name: `operationId` if present, else sanitized `method + path` (names limited to `[a-zA-Z0-9_-]`, 64 chars). If a body schema is a plain object, its `properties`/`required` are merged into the top-level param schema; otherwise nested under `body`.
- `isMutation` = method is post/put/patch/delete → later drives the "Are you sure?" confirmation step.
- Track security scheme per endpoint (`op.security` ?? global `security`). Auth header is injected at execution time — **never** passed to the LLM.
- Prune per request: large specs don't fit in context. MVP: RAG-lite (semantic/keyword match on endpoint descriptions) before full vector search.

## Progress (what's built so far)

- [x] Backend skeleton: env validation, Postgres (TypeORM, `synchronize:true`), Redis (`REDIS_CLIENT` global), BullMQ (`telegram-updates` queue), tenants/services entities.
- [x] OpenAPI → tools parser with unit tests (`src/agents/openapi-parser.service.spec.ts`, 8 tests).
- [x] Agent loop: `LlmService` (OpenRouter client), `ToolExecutorService` (HTTP + auth injection), `AgentLoopService` (max 5 iterations, error-fed-back self-correction, fallback model on retryable error/empty reply, mutation interception via `pendingMutations` allowlist). Unit-tested.
- [x] Telegram webhook → BullMQ pipeline: `POST /telegram/webhook/:botToken` → `TelegramService` (route by bot token, dedupe via Redis SETNX, enqueue) → `TelegramUpdatesProcessor` (load service → cached tools → agent loop → save session → reply). `TelegramApiService` (sendMessage/getMe/setWebhook), `ToolProviderService` (parse+cache tools, TTL 1h), `SessionsModule`. Unit-tested.
- [x] Bot replies render Markdown as Telegram HTML: LLM replies (which use GFM tables/bold/lists) go through `src/telegram/markdown.ts` (`markdownToTelegramHtml`) and are sent with `parse_mode: 'HTML'`; tables become `•`-separated rows, `<br>`/`**`/`<`/`&` inside cells are escaped so the payload is always valid HTML. If Telegram rejects the HTML (400), `sendMessage` retries once as plain text. `TelegramApiService.sendMessage` is the single choke point — no raw Markdown reaches end users. Unit-tested.
- [x] Confirmation step for mutations — a 3-state machine with LLM judgment (fixed the "no it's fine, order it" + double-confirm + raw-args bugs on 2026-08-08): the agent loop never executes an unconfirmed `isMutation` tool call — it intercepts, asks the LLM for a natural action summary ("May I place an order for 1 Maple Arc Compass with standard shipping?"; deterministic fallback if that call fails), and returns `pendingToolCall` + `confirmationSummary`. The processor persists `{ toolCall, summary, askCount }` (Redis `session:confirm:{serviceId}:{chatId}`). Next turn: intent is decided by a **classification ladder** — (1) strict exact-phrase regex fast-path (`yes`/`ok`/`go ahead` → CONFIRM, `no`/`cancel` → DECLINE, whole-message match only), (2) otherwise a tiny 1-word LLM judge that handles hedged approvals ("no it's fine, go ahead" → CONFIRM) and (3) UNCLEAR for questions/restatements. CONFIRM → call passed as `context.pendingMutations` allowlist and executed; DECLINE → system note forbids mutation calls; UNCLEAR → the pending is **kept** (`askCount++`, agent answers normally, never re-asks) and after `MAX_CONFIRM_ASKS` (3) it's dropped with a "I didn't get a clear yes or no" message — guaranteed termination. A mutation can only execute on a turn after an explicit positive CONFIRM. The old lead-3-tokens `confirmIntent` keyword classifier is gone.
- [x] Frontend BotFather guide: `src/components/dashboard/BotFatherGuide.tsx` — an expandable 3-step walkthrough inside the "Connect a service" modal (deep link to `https://t.me/BotFather`, copy-`/newbot` button, token example) plus a `@BotFather` hint on the tenant empty state; full docs at `https://core.telegram.org/bots/features#creating-a-new-bot`.
- [x] Dashboard UI polish (2026-08-08): landing `Nav` mobile bar is just Logo + hamburger with the theme toggle inside the menu (was a floating `[☰][🌙]` pair); removed the stub "Docs" button that pointed at `#cta`. `DashboardHeader` collapses the device-key pill to an icon-only reset button on mobile (`hidden sm:flex`). Services card in `TenantDetail` restructured into two stacked blocks on mobile (info row + bordered meta/actions row, `sm:` single row) with `truncate` on long values. "Connect a service" modal marks required fields (Name, Base URL, OpenAPI spec, Bot token) with a coral `*`. Build + oxlint clean.
- [x] Onboarding API (`src/tenants`): `GET /tenants`, `GET /tenants/:id`, `GET|POST /tenants/:id/services`, `PATCH /tenants/:id/services/:serviceId`, `DELETE /tenants/:id/services/:serviceId`. `createService` validates the OpenAPI spec (via `OpenApiParserService`), validates the bot token (`getMe`), builds the webhook URL from `PUBLIC_BASE_URL` + `/telegram/webhook/{botToken}`, registers it (`setWebhook`), then saves the row. `botToken` is `unique` in Postgres (duplicate → 409). `updateService` (PATCH) edits `name`/`baseUrl`/`openapiSpec`/`authHeaderName`/`authHeaderValue` — re-validates a changed spec, busts the tools cache via `ToolProviderService.invalidate`, and leaves `botToken` immutable. **`authHeaderValue` is masked (`null`) in every API response** — the frontend only knows `hasAuth` via `authHeaderName`; the edit modal leaves the value blank to keep the current one. DTO validation via class-validator (`IsUrl`, bot-token `Matches`, etc.). Unit-tested.
- [x] JWT auth (`src/auth`, backend): `POST /auth/signup` (`companyName`/`email`/`password` ≥ 8) creates a **tenant + owner user atomically** (signup replaces the old `POST /tenants`), `POST /auth/login`, `GET /auth/me` (re-issues a token). Passwords hashed with scrypt (per-user salt, `timingSafeEqual`). Tokens: `JwtModule` (`JWT_SECRET`, 7-day expiry), payload `{ sub: userId }`. `JwtAuthGuard` verifies the token + loads the user (with `tenant`) per request, attaches it to `request.user`; `CurrentUser` decorator reads it. **Every `/tenants*` route and `POST /mock/:slug/register` is protected by `JwtAuthGuard`** (class/method-level — no global guard). `TenantsService` enforces ownership (`assertOwned`: user.tenantId === tenantId, else 404); `GET /tenants` always returns just the caller's tenant. Unit-tested.
- [x] Session state in Redis with token budget + LLM summarization: state is `{ summary, history }` at `session:{serviceId}:{chatId}` (TTL 24h, cap 40 msgs). On append, if estimated tokens (~chars/4) exceed `SESSION_TOKEN_BUDGET` (default 3000), the oldest half is summarized via `LlmService` into a rolling summary; if the LLM call fails, the old messages are dropped without a summary so the pipeline never breaks. The processor injects the summary as a leading system message. Unit-tested.
- [x] Global `ValidationPipe` (whitelist + transform), CORS enabled; `GET /` returns API info, `GET /health` returns status/uptime/timestamp.
- [ ] Service registration + setWebhook (end-to-end wiring) — DONE; remaining: verify with a real bot + ngrok
- [x] Frontend landing page (Vite + React + TS + Tailwind v4): brand system in `src/index.css`, sections in `src/components/` (Nav, Hero with animated chat, endpoint Marquee, HowItWorks, Showcase "what you see vs what happens", Safety, Features, Pricing, FAQ accordion, CTA, Footer). `Reveal` (IntersectionObserver) wrapper for scroll-ins, grain overlay, Fraunces/Instrument Sans/Geist Mono. Build + oxlint clean.
- [x] Frontend dashboard (React Flow web app): routes `/app` (workspace) and `/app/tenants/:tenantId` (service list, create/delete service, SystemMap graph). Axios client in `src/api/client.ts` (base URL from `VITE_API_BASE_URL`, default `http://localhost:3000`). Dashboard pages are `React.lazy` code-split so the landing bundle stays lean. Build + oxlint clean.
- [x] Frontend auth (2026-08-09): the console is JWT-based. Global state is **zustand** (`src/store/auth.ts`): the store initializes from `localStorage['lyrebird_auth']`, and `hydrate()` refreshes via `/auth/me` on app load. `Auth` page at `/auth` does signup/login (tabbed, animated pill), `RequireAuth` guards `/app*` (redirect to `/auth` with `state.from`; `/login` redirects to `/auth`). The axios client attaches `Authorization: Bearer <token>` on every request and a 401 response interceptor clears the stored session and bounces to `/auth` (never for `/auth/login` + `/auth/signup` themselves, so a bad password just shows the error). `DashboardHeader` shows the signed-in user + sign-out; the landing `Nav` routes Console/Get started to `/auth` when signed out. The old auto-generated device key (`lib/device.ts`, `X-Admin-Key` header) is gone. Build + oxlint clean.
- [x] Mock API module (`src/mock`, dev-only): three built-in "company" APIs — store (orders/membership), stream (subscription/watchlist), dispatch (courier/tracking) — each with a served OpenAPI spec, live in-memory state, and sample prompts. Covers queries, path/query params, mutations (drives the confirmation step), error responses, and the `X-API-Key` security scheme (auth-injection path). `GET /mock` index, `GET /mock/:slug/openapi.json`, `POST /mock/:slug/register` convenience, catch-all dispatcher. Unit + live-tested. Delete before launch.
- [x] Encryption at rest (2026-08-08): `CryptoService` (`src/security`) encrypts **`openapiSpec`, `botToken`, `authHeaderValue`** with AES-256-GCM using `DATA_ENCRYPTION_KEY` (SHA-256-derived key, format `v1:iv.tag.ciphertext`, random IV per write). Bot-token routing now uses a deterministic **`bot_token_hash`** column (SHA-256, unique) — the webhook router hashes the incoming token and looks the service up by hash, so the raw token is never stored in a queryable form. Writes encrypt in `TenantsService.createService`/`updateService`; reads decrypt in `TelegramUpdatesProcessor` (spec → tool provider, auth → executor context, botToken → sendMessage). API responses go through `TenantsService.serialize` (decrypts `openapiSpec`/`botToken`, still masks `authHeaderValue` as `null`) — the frontend contract is unchanged. `EncryptionMigratorService` (`src/tenants`, `OnModuleInit`) backfills legacy plaintext rows at boot (hashes first, then encrypts). `decrypt` passes non-`v1:` values through untouched so mixed states stay safe. Unit-tested (124 tests) + verified live (DB shows `v1:` ciphertext). **No encryption is optional at rest — `DATA_ENCRYPTION_KEY` is required at boot.**

### Model choice (researched 2026-08-08, from OpenRouter live API)
- Default: `nvidia/nemotron-3-nano-30b-a3b:free` (validated tool-calling). Fallback: `google/gemma-4-26b-a4b-it:free`.
- Model is a config knob: `OPENROUTER_MODEL` / `OPENROUTER_FALLBACK_MODEL` env vars.
- All 13 free tool-calling models support it; free-tier limits ~20 req/min, 50/day without balance.
- Agent loop fallback rule: retryable LlmError (429/5xx/network) OR empty reply on the primary model → retry once with fallback model.

Local dev notes:
- Postgres 17 Windows service `postgresql-x64-17`, credentials in `backend/.env` (password was reset via pg_hba trust procedure on 2026-08-08).
- Redis runs via WSL relay (port 6379).
- `PUBLIC_BASE_URL` must be set to a public HTTPS URL (ngrok) to register services end-to-end; without it, `createService` returns 400.
- `JWT_SECRET` is **required** at boot (env validation fails without it) — it signs the 7-day auth tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put it in `backend/.env`. All `/tenants*` routes require `Authorization: Bearer <token>`.
- `SESSION_TOKEN_BUDGET` (tokens, default 3000) governs when sessions summarize old messages via the LLM; summarization needs `OPENROUTER_API_KEY`.
- Cloud ready (2026-08-08): Postgres takes a full `DATABASE_URL` (else host/port) — set `DB_SSL=true` for Neon/Supabase and `DB_SYNCHRONIZE=false` in prod (default `true` unless explicitly `"false"`). Redis takes a `REDIS_URL` (ioredis options built by `src/redis/redis-config.ts`, used by both `RedisModule` and BullMQ) — Upstash is TLS-only `rediss://`; when `REDIS_URL` is set, `REDIS_HOST`/`REDIS_PORT` are ignored (env validation is `@ValidateIf`-conditional). Local `backend/.env` keeps host/port + a commented cloud override block.
- `DATA_ENCRYPTION_KEY` is **required** at boot (env validation fails without it). Any string works — it is SHA-256-derived into the AES-256-GCM key. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put it in `backend/.env`. It encrypts `openapiSpec`/`botToken`/`authHeaderValue` at rest; lose it and those rows can't be decrypted.

Onboarding flow (end-to-end):
```
POST /auth/signup { companyName, email, password }     → token + user + tenant (created atomically)
POST /auth/login { email, password }                   → token + user + tenant
POST /tenants/{id}/services { name, baseUrl, openapiSpec, botToken, authHeaderName?, authHeaderValue? }
  (requires Authorization: Bearer <token>; scoped to the caller's tenant)
  1. parse/validate OpenAPI spec (fails fast → 400)
  2. getMe(botToken) validates the bot
  3. setWebhook(`${PUBLIC_BASE_URL}/telegram/webhook/${botToken}`)
  4. save row (duplicate botToken → 409)
User texts bot → Telegram POSTs to /telegram/webhook/{botToken} → pipeline
```

### Mock APIs for end-to-end testing (dev-only — delete before launch)
- `src/mock` serves three self-contained mock companies. Each is `{ slug, name, blurb, spec, seed, routes, samplePrompts }` in `mock-data.ts`; `MockService` is a generic dispatcher (`:name` path patterns → params, in-memory `seed` state that persists across calls until restart). `createMockApis()` deep-clones seeds so every service instance (and every jest test) gets isolated state.
  - `store` — Feather & Forge: products, orders (place/cancel), account prefs, invoices. Queries + confirmable mutations + conflict errors (can't cancel a shipped order).
  - `stream` — Nova Cinema: plans, watchlist, pause/resume. Enum validation, 409 on double-pause.
  - `dispatch` — Swift Post: tracking, price quotes (query params), reschedule, ratings. Path + query params, weight/zone validation.
- Routes: `GET /mock` (index + sample prompts), `GET /mock/{slug}/openapi.json` (spec to paste into `openapiSpec`), `POST /mock/{slug}/register { tenantId, botToken, name?, authHeaderName?, authHeaderValue? }` (convenience: auto-fills `baseUrl = http://127.0.0.1:{PORT}/mock/{slug}` and the spec, then runs the full `createService` pipeline), plus a catch-all dispatcher at `/mock/{slug}/*`.
- All specs declare the `X-API-Key` apiKey security scheme at document level, so the tool executor exercises its auth-injection path (the mock ignores the header value).
- Express 5 gotcha: the catch-all must be `@All(':slug/*path')` (named wildcard) — legacy `:slug/*` logs a path-to-regexp warning. Specific routes (`/openapi.json`, `/register`) are declared before the catch-all so precedence is by registration order.
- Specs must stay registerable: `mock.service.spec.ts` re-parses each spec through `OpenApiParserService` and asserts every path becomes a tool.

### 2. Agent loop (request → action)
```
user message → build context (session + pruned tools) → LLM decides: tool_call or reply
  → if tool_call: validate params → execute HTTP → return result to LLM
  → LLM formats final answer → reply to Telegram
```
- Max iterations (3–5) to stop runaway multi-call loops.
- **Confirmation step** (implemented): an `isMutation` tool call is never executed on the turn it is first proposed. The loop intercepts it, asks the LLM for a short natural summary of the action (`AgentResult.confirmationSummary`, e.g. "place an order for 1 Maple Arc Compass with standard shipping"), replies `May I {summary}?`, and the processor persists `{ toolCall, summary, askCount }` to Redis (`session:confirm:{serviceId}:{chatId}`). On the next turn the processor runs a **classification ladder** (see the Progress note above): exact-phrase fast-path → 1-word LLM judge → UNCLEAR. CONFIRM passes the call as `context.pendingMutations` (allowlist checked by tool name) and executes; DECLINE injects a system note forbidding mutation calls; UNCLEAR bumps `askCount`, keeps the pending (so a question is answered without re-asking), and drops it with a graceful message after `MAX_CONFIRM_ASKS` (3) unclear replies — guaranteed termination. A mutation can only execute on a turn after an explicit positive CONFIRM.

### 3. Session state (Redis)
- State is `{ summary: string | null, history: ChatMessage[] }` at `session:{serviceId}:{chatId}` (TTL 24h, history capped at 40 messages).
- Token budget: on append, if estimated tokens (chars/4) exceed `SESSION_TOKEN_BUDGET` (default 3000), the oldest half of history is rolled into a rolling `summary` via an `LlmService` call (no tools). If the LLM call fails, the oldest messages are dropped without a summary — the pipeline never breaks.
- Pending mutation confirmations live in a separate key `session:confirm:{serviceId}:{chatId}`.

### 4. Queue pipeline (BullMQ)
```
webhook → TelegramService:
  1. dedupe (Telegram redelivers) via Redis SETNX on update_id  ← only here, in the webhook handler
  2. enqueue update job
processor:
  3. load session → LLM → maybe execute → reply
```
- Dedupe lives **only** in `TelegramService.handleUpdate`. Do **not** re-dedupe in the processor — the processor used to re-claim the same key with SETNX, which always failed and silently no-opped every job (fixed 2026-08-08).
- Queue per service (rate limiting + isolation).
- Retry: exponential backoff, distinct handling for unrecoverable LLM/API errors.

## Conventions

- Package manager: **yarn** only. Do not introduce package-lock.json.
- Folder names lowercase.
- No code comments unless asked.
- **Import aliases**: use `@/` for all intra-repo imports (e.g. `@/agents/llm.service`), never relative paths. Backed by `paths: { "@/*": ["./src/*"] }` in `tsconfig.json` (no `baseUrl` — deprecated in TS 7). Backend: tsc rewrites the aliases to relative specifiers in emitted `dist`, so `node dist/main.js` runs with no runtime helper; Jest resolves them via `moduleNameMapper`. Frontend: Vite resolves them via `resolve.alias` in `vite.config.ts` (tsconfig `paths` mirrors it for `tsc -b`).
- Frontend styling: Tailwind v4 theme tokens (`@theme` in `src/index.css`) — prefer semantic utilities (`bg-paper`, `text-ink-soft`, `text-coral`) over raw hex. Fonts come from Google Fonts in `index.html`. Motion via the CSS keyframes in `index.css` (`.rise`, `.pop`, `marquee`) + the `Reveal` wrapper; don't add animation libraries.
- Frontend icons: Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`). Render with `<HugeiconsIcon icon={X} size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />` — absolute stroke width keeps a crisp ~1.5px weight at any size. The brand `LogoMark` SVG stays hand-drawn.
- Frontend app routes: `react-router-dom` BrowserRouter in `App.tsx` (`/` landing, `/auth` login/signup, `/app` dashboard, `/app/tenants/:tenantId` detail). Dashboard pages are `React.lazy`-loaded. All HTTP goes through `src/api/client.ts` (axios, base URL from `VITE_API_BASE_URL`, default `http://localhost:3000`); it sends `Authorization: Bearer <token>` from `localStorage['lyrebird_auth']` (managed by the zustand store in `src/store/auth.ts`) and a 401 response interceptor bounces to `/auth`. The dashboard routes are wrapped in `RequireAuth`. React Flow graphs live in `src/components/dashboard/SystemMap.tsx` (custom brand-styled nodes, `@xyflow/react`).
- TypeORM column gotcha: `nullable: true` columns typed as `string | null` make reflect-metadata report `Object` and TypeORM can't infer the type → always give explicit `type: 'varchar'` (etc.) on union-typed columns.
- `strictPropertyInitialization: false` is set in tsconfig (validation/DTO classes are populated by class-transformer, not constructors).
- Root package.json needs `private: true` before workspaces (yarn warns otherwise).
- Frontend lint/typecheck: `yarn build` (tsc -b + vite build) and `yarn lint` (oxlint) in `frontend/`; keep both clean.
