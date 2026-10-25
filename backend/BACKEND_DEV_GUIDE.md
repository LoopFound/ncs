# Backend Developer Guide (NCS Santhanam)

Quick start for the backend developer. For deep ops detail see `README.md` and `infra/`.

## 1. What this app is

Next.js 16 app (port **3100**) holding auth, admin, cart, checkout, orders, inventory, payments and APIs, plus a **BullMQ worker** (health check on port **3001**) for email, invoices, notifications and order-expiry jobs.

Dependencies: PostgreSQL, Redis, S3-compatible storage, Razorpay, SMTP / MSG91.

## 2. Frontend vs backend: how they are synced

**They are intentionally NOT connected at runtime.**

- `../frontend` (port 3000) is a static storefront. It makes **no API calls** to this backend. Its cart is client-side state only.
- The frontend uses a **static catalog snapshot** in `frontend/src/data/mock.ts`.
- The source of truth for products is `prisma/seed-data.ts` in this folder.
- If you change product names, prices or images here, **update the frontend snapshot by hand**. Do not import backend code into the frontend or add a build-time dependency (see `../decisions.md`).
- Checkout, payments, orders and real login only work in this backend app. The frontend `/login` page is a static UI and cannot sign anyone in.
- Last check: all 16 frontend products matched the seed by name and price. The seed also contains additional products that the frontend does not list; confirm with the team whether they should be added.

Open decision: wiring the frontend to this API (shop, cart, checkout, auth) needs a public backend URL, CORS/cookie config and a move away from static data. It has not been done.

## 3. First-time setup

Requires Node 24+, npm, and Docker Desktop **running**. If Docker is off, `docker compose` and the integration tests fail with a "docker API" or "Postgres at localhost:55432" error.

```powershell
cd backend
npm ci
copy .env.example .env        # then fill in values (see section 5)
docker compose up -d postgres redis mailpit
npm run db:migrate:dev        # apply schema
npm run db:seed               # sample catalog
npm run admin:create          # create an admin user
npm run dev                   # web on http://localhost:3100
npm run worker:dev            # worker, in a second terminal
```

## 4. Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Web app on 3100 |
| `npm run worker:dev` | Background worker |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and integration (needs Postgres on 55432) |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run db:migrate` | Deploy migrations (production) |
| `npm run db:migrate:dev` | Create or apply migrations (dev) |
| `npm run db:seed` | Seed data |
| `npm run build` | Production build |

Status when last verified: typecheck clean, lint clean, 43/43 tests passing.

## 5. Environment variables (`.env`)

Core: `NODE_ENV`, `APP_URL`, `LOG_LEVEL`, `DATABASE_URL`, `DATABASE_POOL_MAX`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `ADMIN_EMAILS`.
Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
Payments: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
Storage: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL`.
Email/SMS: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `SMS_PROVIDER`, `MSG91_*`.
Monitoring: `SENTRY_DSN`.

Never commit `.env`. Production values: see `.env.production.example`.

## 6. Where things live

| Path | Contents |
| --- | --- |
| `src/app/api/` | Routes: `auth/[...all]`, `cart`, `search/suggest`, `orders/[id]/invoice`, `webhooks/razorpay`, `admin/uploads`, `admin/newsletter/export`, `health`, `ready` |
| `src/app/admin/` | Admin pages |
| `src/server/actions/` | Server actions (cart, checkout, account, admin) |
| `src/server/services/` | Domain logic: catalog, cart, checkout, orders, pricing, payments, inventory, invoices, notifications |
| `src/worker/` | BullMQ jobs |
| `prisma/` | Schema, migrations, seed |
| `tests/` | Unit, integration, e2e, load |
| `infra/` | VPS, Caddy, backups, Terraform |

## 7. Gotchas

- Docker Desktop must be running before tests or `docker compose`.
- Integration tests use Postgres on `localhost:55432` (override with `NCS_PG_PORT`).
- Razorpay webhooks need a public URL (use a tunnel in dev).
- Frontend and backend deploy independently; backend downtime must never break the storefront.
- Record meaningful changes in `../decisions.md`.
