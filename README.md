# NCS Santhanam

NCS Santhanam is an online silk-saree storefront with a separate production commerce backend. The repository keeps both applications independent so the public catalog can remain available even when backend services are offline or under maintenance.

## Start here

Choose the application that matches your task:

| Goal | Project | Local URL | Required services |
| --- | --- | --- | --- |
| Change the public storefront or browse the static catalog | `frontend/` | `http://localhost:3000` | Node.js only |
| Work on admin, authentication, orders, payments, inventory, or APIs | `backend/` | `http://localhost:3100` | Node.js, PostgreSQL, Redis, and S3-compatible storage |
| Process email, invoices, notifications, and order-expiry jobs | `backend/` worker | health check on port `3001` | Backend services plus Redis |

For the quickest storefront start:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Repository layout

```text
.
├── frontend/                 Customer-facing Next.js storefront
│   ├── public/               Images and static assets
│   └── src/
│       ├── app/              App Router pages and layouts
│       ├── components/       Header, footer, home, and shop UI
│       ├── context/          Client state such as the cart
│       └── data/             Static storefront catalog snapshot
├── backend/                  Production commerce and administration app
│   ├── prisma/               Schema, migrations, and seed data
│   ├── src/
│   │   ├── app/              Admin pages, auth pages, and API routes
│   │   ├── server/           Domain services, actions, auth, and adapters
│   │   └── worker/           BullMQ jobs and health server
│   ├── tests/                Unit, integration, E2E, and load tests
│   └── infra/                VPS, Caddy, backups, storage, and AWS Terraform
├── decisions.md              Engineering decision history
└── README.md                 Repository-level guide
```

## How the system fits together

```text
Customer browser
      |
      +--> frontend/  Static storefront, catalog browsing, and presentation UI
      |
      +--> backend/   Auth, admin, cart, checkout, orders, inventory, and APIs
                         |
                         +--> PostgreSQL   durable commerce data
                         +--> Redis        cache, sessions, rate limits, and queues
                         +--> S3           product media and private invoices
                         +--> BullMQ       background jobs
                         +--> Razorpay     online payments and webhooks
                         +--> SMTP/MSG91   email and SMS notifications
```

The frontend intentionally uses its own static catalog snapshot. When product facts change in `backend/prisma/seed-data.ts`, update the matching frontend data deliberately. Do not create a build-time dependency between the two applications.

## Prerequisites

Use these versions for the full repository:

- Node.js 24 or newer
- npm
- Docker Desktop with Docker Compose
- Git
- Optional: `k6` for backend load tests
- Optional: Terraform for AWS infrastructure work

Check the main tools:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## Frontend workflow

The frontend is a Next.js 16 application using React 19, Tailwind CSS 4, and Framer Motion. It does not require the backend for normal local rendering.

### Install and run

```powershell
cd frontend
npm ci
npm run dev
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local storefront on port `3000` |
| `npm run lint` | Run ESLint |
| `node node_modules/typescript/bin/tsc --noEmit` | Run TypeScript without producing files |
| `npm run build` | Create the production Next.js build |
| `npm run start` | Start an existing production build |

### Main frontend paths

| Path | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Homepage composition |
| `src/components/home/` | Hero and homepage sections |
| `src/components/Header.tsx` | Desktop and mobile navigation |
| `src/components/Footer.tsx` | Footer and contact presentation |
| `src/app/shop/` | Catalog and product pages |
| `src/context/CartContext.tsx` | Client cart state |
| `src/data/mock.ts` | Static catalog and storefront content |
| `public/images/` | Local product and brand media |

### Adding or changing a storefront page

1. Find the route under `frontend/src/app/`.
2. Reuse shared header, footer, components, data, and design tokens.
3. Keep route names and existing content contracts stable unless the change requires otherwise.
4. Check desktop and mobile layouts in the browser.
5. Run lint, TypeScript, and a production build.
6. Record meaningful design or architecture choices in `decisions.md`.

## Backend workflow

The backend is a separate Next.js 16 application. It owns authentication, administration, database-backed commerce, payments, notifications, and background jobs.

### 1. Install dependencies

```powershell
cd backend
npm ci
```

### 2. Create local environment configuration

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Set a strong `BETTER_AUTH_SECRET` as described inside `.env.example`. Local Docker defaults already match the example service URLs. Never commit `.env`, production secrets, payment keys, or private credentials.

Environment variables are grouped by purpose:

| Area | Important variables |
| --- | --- |
| Application | `NODE_ENV`, `APP_URL`, `LOG_LEVEL` |
| Database | `DATABASE_URL`, `DATABASE_POOL_MAX` |
| Redis | `REDIS_URL` |
| Authentication | `BETTER_AUTH_SECRET`, Google OAuth values, `ADMIN_EMAILS` |
| Payments | Razorpay key, secret, and webhook secret |
| Storage | S3 endpoint, region, buckets, credentials, and public URL |
| Email | SMTP host, port, security, credentials, and sender |
| SMS | provider and MSG91 credentials/templates |
| Monitoring | `SENTRY_DSN` |

### 3. Start local infrastructure

```powershell
docker compose up -d
docker compose ps
```

Run these commands from `backend/`.

| Service | Default local address | Purpose |
| --- | --- | --- |
| PostgreSQL | `localhost:55432` | Primary database |
| Redis | `localhost:56379` | Cache, sessions, and BullMQ |
| SeaweedFS S3 | `http://localhost:58333` | Local object storage |
| Mailpit SMTP | `localhost:51025` | Captures outgoing local email |
| Mailpit UI | `http://localhost:58025` | Displays captured email |

Ports can be changed with the `NCS_*_PORT` variables documented in backend configuration.

### 4. Prepare the database

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

- `db:generate` creates the Prisma client.
- `db:migrate` applies committed migrations.
- `db:seed` loads the repeatable starter catalog and settings.

For schema development, use `npm run db:migrate:dev` and commit the generated migration. Production uses `npm run db:migrate`, never an interactive development migration.

### 5. Create an administrator

```powershell
npm run admin:create -- owner@example.com "Owner Name" "a-long-unique-password"
```

Use a local-only address and password during development. Do not paste production credentials into shell history.

### 6. Run the application and worker

Terminal 1:

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run worker:dev
```

Open:

- Backend application: `http://localhost:3100`
- Admin: `http://localhost:3100/admin`
- Login: `http://localhost:3100/login`
- Liveness: `http://localhost:3100/api/health`
- Readiness: `http://localhost:3100/api/ready`

### Main backend areas

| Area | What it owns |
| --- | --- |
| `src/app/admin/` | Orders, products, inventory, customers, coupons, reviews, banners, messages, newsletter, settings, and audit log |
| `src/app/api/` | Auth, cart, search, health, readiness, uploads, invoices, and Razorpay webhooks |
| `src/server/services/` | Catalog, cart, pricing, checkout, inventory, orders, payments, invoices, and notifications |
| `src/server/actions/` | Validated and authorized server mutations |
| `src/worker/` | Queued email, invoice, notification, and expiry work |
| `prisma/schema.prisma` | Database model and constraints |
| `prisma/seed-data.ts` | Canonical starter catalog facts |

## Important commerce rules

These rules protect money, stock, and customer data. Preserve them when changing the backend:

- Store money as integer paise, not floating-point currency.
- Prices include GST; extract tax per order line using the configured category rate and HSN code.
- Reserve stock atomically and keep the database constraint that prevents negative stock.
- Treat signed Razorpay webhooks as the payment source of truth.
- Record each webhook event once so retries remain idempotent.
- Verify authentication and authorization inside every protected action or route.
- Validate untrusted input at the server boundary.
- Keep private invoices and secrets out of public storage.
- Keep migrations backward-compatible during rolling releases.

## Testing and verification

### Frontend

```powershell
cd frontend
npm run lint
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Also inspect the homepage, navigation, product pages, cart, checkout presentation, and login at desktop and mobile widths.

### Backend

Start PostgreSQL and Redis before integration or E2E tests:

```powershell
cd backend
docker compose up -d postgres redis
npm run lint
npm run typecheck
npm test
npm run build
npm run worker:build
npm run test:e2e
```

Test coverage includes:

- unit tests for pricing and domain rules;
- integration tests for commerce behavior;
- Playwright journeys for signup, verification, checkout, admin fulfilment, invoices, access control, cart merge, search, and mobile navigation;
- a k6 browsing scenario under `tests/load/`.

Run the optional load test:

```powershell
k6 run -e BASE_URL=http://localhost:3100 tests/load/browse.js
```

## Common development processes

### Change product data

1. Update canonical backend seed facts in `backend/prisma/seed-data.ts`.
2. Update related schema or migrations only if the data shape changes.
3. Rerun the backend seed against a safe local database.
4. Deliberately synchronize the frontend snapshot in `frontend/src/data/`.
5. Verify catalog, product detail, cart, and admin screens.

### Change the database schema

1. Update `backend/prisma/schema.prisma`.
2. Run `npm run db:migrate:dev` locally.
3. Inspect the generated SQL for destructive operations.
4. Update seed data and affected services.
5. Run unit, integration, build, and E2E checks.
6. Keep migration changes compatible with the previous application version for safe rolling deployment.

### Add a backend feature

1. Put business rules in `src/server/services/`.
2. Add validation and authorization at the server action or API boundary.
3. Use the existing database, cache, queue, and logging helpers.
4. Add focused unit or integration coverage.
5. Add E2E coverage only when the user journey changes.
6. Verify worker behavior if the feature queues background work.

### Submit a pull request

1. Branch from current `main`.
2. Keep the change focused.
3. Update `decisions.md` for meaningful code or architecture changes.
4. Run the relevant checks.
5. Commit with a concise Conventional Commit subject and a diff-specific body.
6. Push the branch and open a PR against `main`.
7. Confirm CI and preview deployment results before merging.

## Deployment

### Frontend on Vercel

Create a Vercel project from this repository and set its Root Directory to `frontend`.

Recommended release flow:

1. Open a PR against `main`.
2. Review the Vercel preview.
3. Verify important routes and responsive layouts.
4. Merge only after checks pass.
5. Confirm the production deployment and live routes.

### Backend on a VPS

The starting production option uses Docker Compose, Caddy, automated TLS, health checks, backups, and release scripts under `backend/infra/vps/`.

High-level flow:

1. Provision Ubuntu 24.04.
2. Run `infra/vps/bootstrap.sh` once.
3. Create `/opt/ncs/.env.production` from `.env.production.example`.
4. Add required GitHub variables and secrets.
5. Build and publish application images.
6. Run a pre-deploy backup and database migrations.
7. Start new app containers and switch traffic only after readiness succeeds.
8. Keep the previous release available for rollback.

See [backend/README.md](backend/README.md) for exact server preparation, secrets, first-release, backup, restore, and rollback commands.

### Backend on AWS

Terraform under `backend/infra/terraform/aws/` defines the VPC, load balancer, WAF, ECS services, RDS PostgreSQL, RDS Proxy, ElastiCache Redis, S3, CloudFront, Secrets Manager, ECR, SES, and monitoring.

Use this option when managed availability and horizontal scaling justify the added cost and operational complexity. Read the backend deployment guide and inspect the Terraform plan before applying it.

## Production readiness checklist

Before a public launch, confirm:

- [ ] Real GSTIN, GST rates, and HSN codes are approved.
- [ ] Store address, phone, WhatsApp, email, and hours are correct.
- [ ] Marketing claims and policy pages are approved.
- [ ] Real product photography replaces marked placeholders.
- [ ] Razorpay live keys and webhook secret are configured.
- [ ] MSG91 DLT templates and production SMS credentials are configured.
- [ ] Sending domain and production email provider are verified.
- [ ] Production secrets are stored outside Git.
- [ ] Database migrations, backups, restore, and rollback are tested.
- [ ] Health, readiness, logs, alerts, and worker health are monitored.
- [ ] Desktop and mobile purchase journeys pass end to end.

## Troubleshooting

### Port already in use

- Frontend defaults to `3000`.
- Backend defaults to `3100`.
- Supporting services use the ports listed above.
- Stop the conflicting process or change the appropriate port variable.

### Prisma client or generated types look stale

```powershell
cd backend
npm run db:generate
npm run typecheck
```

### Backend tests cannot reach PostgreSQL or Redis

```powershell
cd backend
docker compose up -d postgres redis
docker compose ps
```

Wait for both health checks before rerunning tests.

### Next.js reports a `.next` lock

Another development server is using that project directory. Reuse or stop the existing server before starting another one. Do not delete a live lock blindly.

### Windows reports `spawn EPERM`

This can be an environment or process-permission failure rather than a TypeScript or compilation error. Close duplicate Node processes, confirm the project is writable, and rerun from a normal PowerShell terminal. Keep compile, typecheck, and runtime failures separate when reporting results.

### Production build is memory constrained

For the backend, use the documented lower-memory build fallback:

```powershell
$env:NEXT_BUILD_CPUS = "1"
npx next build --webpack
```

## Documentation ownership

- Root workflow and repository structure: this file
- Backend operations and deployment: [backend/README.md](backend/README.md)
- Architectural and implementation decisions: [decisions.md](decisions.md)
- Environment variable examples: `backend/.env.example` and `backend/.env.production.example`

Keep documentation in the same pull request as the behavior it describes.
