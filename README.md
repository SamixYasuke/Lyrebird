# Lyrebird

> Give your product a voice.

Lyrebird is a SaaS that turns any REST API into a Telegram bot — without writing a bot for each company. A company connects their existing product API (a base URL + an OpenAPI/Swagger spec), and their end users can then operate the product in plain language from inside Telegram.

**End user:** "Check my order status"
**Bot:** calls the company's API → "Your Maple Arc Compass shipped on Tuesday."

**End user:** "Cancel my subscription"
**Bot:** "May I cancel your Starling plan? It will stop renewing today." → user says *yes* → done.

The core idea: instead of hand-wiring a bot per company, Lyrebird parses the company's OpenAPI spec, turns every endpoint into a tool definition, and hands those tools to an LLM. The LLM discovers what the API can do on its own, calls the right endpoints, and explains the result back in plain language. It's data-driven, not per-company coding.

The name comes from the lyrebird, a songbird that mimics whatever it hears. An API that learns to speak for itself. (The logo is a feather. We're committed.)

---

## Repo layout

```
unnamed/
├── AGENTS.md          # living knowledge base for the project (why, not just what)
├── backend/           # NestJS API + background workers
└── frontend/          # Vite + React + Tailwind v4 — landing page + dashboard
```

There are two separate yarn projects, not a workspace. All commands below run from inside `backend/` or `frontend/`.

## Tech stack

| Concern | Choice |
| --- | --- |
| Backend | NestJS (TypeScript) |
| LLM provider | OpenRouter — free tier by default (model is a config knob) |
| Database | PostgreSQL (TypeORM, `synchronize: true` in dev) |
| Cache / sessions | Redis (ioredis) |
| Job queue | BullMQ |
| Frontend | Vite + React + TS + Tailwind v4, React Flow dashboard, react-router, axios |
| Package manager | **yarn v1** — never npm |

---

## Prerequisites

- **Node.js** (the project is developed on v24) and **yarn** (`npm i -g yarn` if you don't have it)
- **PostgreSQL** — on Windows this is the `postgresql-x64-17` service
- **Redis** — on this Windows machine it runs through a WSL relay on port 6379
- **A public HTTPS URL** (ngrok or similar) to receive Telegram webhooks — required for end-to-end registration
- **An OpenRouter API key** if you want real answers (see "Model & cost reality" below)

## Quick start

### 1. Backend

```bash
cd backend
yarn install
cp .env.example .env      # then fill in real values (see below)
yarn start:dev            # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
yarn install
yarn dev                  # http://localhost:5173
```

The frontend talks to `http://localhost:3000` by default (override with `VITE_API_BASE_URL`).

### 3. Give Telegram a door in

Telegram posts updates to a URL that must be public HTTPS. In one terminal, keep the backend running; in another:

```bash
ngrok http 3000
```

Copy the ngrok URL into `PUBLIC_BASE_URL` in `backend/.env` and restart the backend. Now when you register a service, the backend builds `https://<ngrok>/telegram/webhook/<botToken>` and tells Telegram about it — and text messages from your bot's chat will actually arrive.

## Environment variables

Backend (`backend/.env`):

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `PORT` | yes | `3000` | HTTP port |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | yes | — | Postgres connection |
| `REDIS_HOST` / `REDIS_PORT` | yes | — | Redis connection |
| `DATA_ENCRYPTION_KEY` | **yes** | — | Key that encrypts tenant credentials at rest. Any string works (it's SHA-256-derived into an AES-256-GCM key); generate a strong one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Back it up — lose it and existing rows can't be decrypted.** |
| `PUBLIC_BASE_URL` | for end-to-end | — | Public HTTPS URL the webhook URL is built from (your ngrok URL, no trailing slash) |
| `OPENROUTER_API_KEY` | for real answers | — | OpenRouter key used for agent replies, the confirmation judge, and session summaries |
| `OPENROUTER_MODEL` | — | `nvidia/nemotron-3-nano-30b-a3b:free` | Primary model (validated for tool calling) |
| `OPENROUTER_FALLBACK_MODEL` | — | `google/gemma-4-26b-a4b-it:free` | Used when the primary retries/errors or returns an empty reply |
| `JWT_SECRET` | **yes** | — | Secret that signs the 7-day JWT auth tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SESSION_TOKEN_BUDGET` | — | `3000` | When a chat's context exceeds this many tokens (approx chars/4), the oldest half is rolled into an LLM summary |

Frontend (`frontend/.env`): `VITE_API_BASE_URL` (optional, defaults to `http://localhost:3000`).

> `synchronize: true` means the schema is generated from the entities on every boot. Fine for dev; don't ship it that way.

### Model & cost reality

The free OpenRouter tier is the default on purpose — it's enough to develop against, but it's rate-limited (roughly 20 req/min, 50/day without a balance). For a demo with real companies, set `OPENROUTER_MODEL` to a paid tool-calling model. There's no per-company code to change; the model is just a knob.

---

## How a message becomes an answer

```
User texts the bot
   ↓
Telegram POSTs the update to /telegram/webhook/{botToken}
   ↓
1. Webhook handler hashes the bot token → looks up the service by hash
2. Dedupe (Telegram redelivers) via Redis SETNX on update_id — only here, never again
3. Job enqueued on the service's BullMQ queue
   ↓
Worker:
4. Load session history + summary from Redis
5. Load cached tools (parsed once from the OpenAPI spec, cached 1h)
6. LLM decides: reply, or call a tool (validate params → HTTP call with auth header injected)
7. Reply rendered as Telegram-safe HTML, sent to the chat
8. Messages appended to the session (TTL 24h, capped at 40)
```

Sessions are keyed `session:{serviceId}:{chatId}`; every step stays inside the tenant's namespacing. The LLM can only call the injected service endpoints — it never touches anything internal.

## Onboarding flow (connecting a company)

```
POST /auth/signup { companyName, email, password }      → token + user + tenant (created atomically)
POST /auth/login { email, password }                    → token + user + tenant
POST /tenants/{id}/services {
    name, baseUrl, openapiSpec, botToken,
    authHeaderName?, authHeaderValue? }
  (Authorization: Bearer <token>; scoped to the caller's tenant)
  1. Parse + validate the OpenAPI spec (fails fast → 400)
  2. getMe(botToken) — is this a real bot?
  3. setWebhook(PUBLIC_BASE_URL/telegram/webhook/{botToken})
  4. Save the row (duplicate bot token → 409)
```

One bot per service (1:1 bot token ↔ service). The bot token is the routing key: webhook → bot token hash → service → tenant. No intent routing needed, no extra state.

The dashboard in `frontend/` wraps all of this — sign up or sign in, and you land in your company's workspace where you add a service (with a built-in BotFather walkthrough for making the bot) and watch its endpoints render as a React Flow graph.

## Mutations need a "yes"

State-changing calls (`POST`/`PUT`/`PATCH`/`DELETE` in the spec) are never executed on the turn they're proposed. The bot:

1. **Intercepts** the call and asks the LLM for a short natural summary — *"May I place an order for 1 Maple Arc Compass with standard shipping?"*
2. **Stores** `{ toolCall, summary, askCount }` in Redis as a pending confirmation.
3. On the next message, decides the customer's intent with a **classification ladder**:
   - exact-phrase fast path (`yes` / `ok` / `no` / `cancel` — whole message only),
   - a tiny 1-word LLM judge that handles hedged approvals like *"no it's fine, go ahead"* (which used to be read as a decline — a real bug we hit),
   - `UNCLEAR` for questions and restatements.
4. CONFIRM → the call executes (only on that later turn, only through an allowlist). DECLINE → the bot is told not to mutate anything. UNCLEAR → it answers the question normally, never re-asks, and drops the pending after 3 unclear replies with "I didn't get a clear yes or no."

A mutation can only ever execute on a turn after an explicit positive CONFIRM. That invariant is enforced in the agent loop, not trusted to the model.

## Mock company APIs (dev only — delete before launch)

`backend/src/mock` ships three self-contained fake "companies" so you can test end-to-end without touching a real API. Each has live in-memory state, a served OpenAPI spec, and sample prompts.

| Slug | Company | What it does |
| --- | --- | --- |
| `store` | Feather & Forge | products, orders (place/cancel), account prefs, invoices — queries + confirmable mutations + conflict errors |
| `stream` | Nova Cinema | plans, watchlist, pause/resume — enum validation, 409 on double-pause |
| `dispatch` | Swift Post | tracking, price quotes, reschedule, ratings — path + query params, weight/zone validation |

Routes: `GET /mock` (index + sample prompts), `GET /mock/{slug}/openapi.json` (the spec to paste), `POST /mock/{slug}/register` (auto-fills base URL + spec, then runs the full onboarding pipeline), plus a catch-all dispatcher at `/mock/{slug}/*`.

All specs declare an `X-API-Key` security scheme, so they also exercise the auth-injection path in the tool executor.

## Security

- **Account auth.** The console is JWT-based: signup creates a company + owner atomically, passwords are scrypt-hashed with per-user salts, and sessions last 7 days. Every `/tenants*` route requires `Authorization: Bearer <token>` and only serves the caller's own tenant.
- **Encryption at rest.** `openapiSpec`, `botToken`, and `authHeaderValue` are stored as AES-256-GCM ciphertext (`v1:iv.tag.ciphertext`, random IV per write) under `DATA_ENCRYPTION_KEY`. A boot-time migrator backfills legacy plaintext rows; `decrypt` passes non-`v1:` values through so mixed states stay safe.
- **Bot tokens are never queryable.** The raw token is encrypted, and routing uses a deterministic SHA-256 `bot_token_hash` column — the webhook handler hashes the incoming token and looks the service up by hash. Uniqueness is enforced on the hash.
- **Auth headers never reach the LLM.** The auth value is injected at request-execution time by the tool executor, and masked (`null`) in every API response. The frontend only ever sees `authHeaderName`.
- **Trust boundary.** The LLM can only call the injected service's endpoints, never internal ones.

## Tests & checks

```bash
# backend — unit tests + build
cd backend && yarn test && yarn build

# frontend — typecheck + build + lint
cd frontend && yarn build && yarn lint
```

There are 124 backend unit tests covering the agent loop, confirmation machine, session budget, OpenAPI parsing, Telegram pipeline, mock dispatcher, and encryption. Run them before changing anything in the pipeline.

## API reference (summary)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | API name + status |
| GET | `/health` | status, uptime, timestamp |
| POST | `/auth/signup` | create a company (tenant + owner user atomically) → token |
| POST | `/auth/login` | sign in → token |
| GET | `/auth/me` | profile + fresh token for the current session |
| GET | `/tenants` | list the caller's tenant (with services) |
| GET | `/tenants/:id` | tenant + its services |
| GET | `/tenants/:id/services` | list a tenant's services |
| POST | `/tenants/:id/services` | register a service (validates spec + bot, sets webhook, saves) |
| PATCH | `/tenants/:id/services/:serviceId` | edit name/baseUrl/spec/auth (bot token is immutable) |
| DELETE | `/tenants/:id/services/:serviceId` | remove a service |
| POST | `/telegram/webhook/:botToken` | Telegram's webhook entry point (don't call this by hand) |
| GET | `/mock` · `GET /mock/:slug/openapi.json` · `POST /mock/:slug/register` | dev-only mock helpers |

Every `/tenants*` route (and `POST /mock/:slug/register`) requires `Authorization: Bearer <token>` and only serves the caller's own tenant.

## Status

This is an MVP in active development. Working today: onboarding + webhook pipeline, the agent loop, the mutation-confirmation machine, session summarization, the mock company APIs, encryption at rest, and the landing page + dashboard. Not yet: real-bot verification with a live company, RAG for very large OpenAPI specs, WhatsApp support, and per-tenant rate limiting/quotas.

---

*Made with the warm editorial conviction that software should talk like people.*
