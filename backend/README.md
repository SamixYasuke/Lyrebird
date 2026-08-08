# Backend

Lyrebird's NestJS API + background workers. See the [root README](../README.md) for the full picture.

## What lives here

- `src/tenants/` — onboarding API (tenants & services), `AdminKeyGuard`, boot-time encryption migrator
- `src/agents/` — OpenAPI → tools parser, OpenRouter LLM client, tool executor (HTTP + auth injection), the agent loop, cached tool provider
- `src/sessions/` — Redis session state, token budget + LLM summarization, pending confirmations
- `src/telegram/` — webhook controller, route-by-token-hash service, BullMQ processor, Telegram API client, Markdown→HTML renderer
- `src/security/` — `CryptoService` (AES-256-GCM at rest for tenant credentials)
- `src/mock/` — dev-only fake company APIs (store / stream / dispatch) for end-to-end testing — delete before launch
- `src/config/`, `src/database/`, `src/redis/`, `src/queues/` — env validation, TypeORM, Redis client, BullMQ wiring

## Running

```bash
yarn install
cp .env.example .env    # fill in values; DATA_ENCRYPTION_KEY is required
yarn start:dev          # http://localhost:3000
```

## Checks

```bash
yarn test               # 124 unit tests
yarn build              # tsc + nest build
```

See the root `README.md` for environment variables, the onboarding flow, and how a message becomes an answer.
