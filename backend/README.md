# NCS Santhanam — online store

Next.js 16 storefront, admin and backend for NCS Santhanam silk sarees, with a background worker, PostgreSQL, Redis and S3-compatible storage.

## Architecture

```
Browser ─► Caddy / ALB ─► web ×N (Next.js standalone) ─┬─► PostgreSQL (via PgBouncer / RDS Proxy)
                                                        ├─► Redis (sessions, cache, rate limits, job queues)
                                                        └─► S3 (product media → CDN, GST invoices → private)
            worker ×M (BullMQ) ─► email (SES/SMTP) · SMS (MSG91) · invoices · payment-hold expiry
Razorpay ──► /api/webhooks/razorpay (signed, idempotent)
```

- **Stateless web tier.** Sessions live in Postgres (cached in Redis) and the catalog cache is in Redis, so you can add replicas freely.
- **Money** is integer paise everywhere. **Prices include GST**, and GST is extracted per line; rates and HSN codes are set per category in the admin.
- **Stock** is reserved with a single conditional `UPDATE` plus a `CHECK (stock >= 0)` constraint, so concurrent checkouts can't oversell. Unpaid online orders release their stock after the payment hold (30 min by default).
- **Payments.** Razorpay Checkout runs in the browser, then the server verifies the HMAC signature. The webhook is the source of truth: every event is recorded once, and a late payment for an expired order is either restored or refunded automatically. Cash on delivery requires a verified mobile number.

| Path | What it is |
| --- | --- |
| `src/app/(store)` | Storefront pages (catalog, product, cart, checkout, account, policies) |
| `src/app/admin` | Admin: orders, products, inventory, categories, customers, coupons, reviews, banners, messages, newsletter, settings, audit log |
| `src/app/api` | Auth, cart, search suggestions, Razorpay webhook, uploads, invoices, health/readiness |
| `src/server/services` | Domain logic: catalog, cart, pricing, checkout, orders, inventory, payments, invoices, notifications |
| `src/server/actions` | Server actions (Zod-validated, auth-checked, audited for admin) |
| `src/worker` | BullMQ worker entry and job handlers |
| `prisma/` | Schema, migrations, idempotent seed (the original catalog) |
| `infra/` | Caddy, SeaweedFS, backup script, Terraform for AWS |
| `tests/` | Vitest unit + integration, Playwright end-to-end, k6 load |

## Local development

Requirements: Node 24 and Docker.

```bash
cp .env.example .env            # then set BETTER_AUTH_SECRET (see the comment in the file)
docker compose up -d            # Postgres :55432, Redis :56379, S3 :58333, Mailpit UI :58025
npm ci
npx prisma migrate deploy
npm run db:seed                 # categories, 29 products, banners, shipping rules
npm run admin:create -- you@example.com "Your Name" 'a-long-password'
npm run dev                     # http://localhost:3100
npm run worker:dev              # second terminal: emails, invoices, order expiry
```

- **Email.** Outgoing email shows up in Mailpit at http://localhost:58025.
- **SMS.** OTPs and SMS print to the console (`SMS_PROVIDER=console`).
- **Payments.** Online payment is disabled until you set Razorpay keys; use `rzp_test_…` keys to try it. Cash on delivery works without keys.
- **Port overrides.** The `NCS_*_PORT` variables move the dev ports if they clash with other projects.

## Tests

```bash
npm run lint && npm run typecheck
npm test            # unit + integration (uses an isolated ncs_test database and Redis DB 15)
npm run build && npm run worker:build
npm run test:e2e    # Playwright on the production build, isolated ncs_e2e database
k6 run -e BASE_URL=http://localhost:3100 tests/load/browse.js
```

The end-to-end suite covers:
- sign-up, email verification, mobile OTP, COD checkout, admin shipping and delivery, and the GST invoice;
- access control and HTTP status codes;
- guest-cart merge, search, and the mobile menu.

On low-memory machines, `NEXT_BUILD_CPUS=1 npx next build --webpack` builds with less memory than the default Turbopack build.

## Deploying

### Option A — single VPS (recommended to start)

One 4 vCPU / 8 GB server in India (e.g. a DigitalOcean Droplet in Bangalore) comfortably serves
~100 concurrent shoppers. GitHub Actions builds the images, pushes them to GitHub Container
Registry and releases them over SSH with `infra/vps/deploy.sh`.

**1. Prepare the server (once).** Create an Ubuntu 24.04 server, then:

```bash
ssh-keygen -t ed25519 -f ncs-deploy -N "" -C ncs-deploy       # key used only by CI
scp infra/vps/bootstrap.sh root@SERVER:
ssh root@SERVER "bash bootstrap.sh '$(cat ncs-deploy.pub)'"
```

The script installs Docker, sets up the firewall (22/80/443), automatic security updates,
fail2ban, swap and log rotation, turns off SSH password logins and creates the `deploy` user.
Then, as `deploy`, create `/opt/ncs/.env.production` from `.env.production.example` (fill every
REPLACE_ME, `chmod 600`), and point the domain's DNS A record at the server.

**2. Connect GitHub (once).** Under *Settings → Secrets and variables → Actions*:

| Name | Kind | Value |
|---|---|---|
| `DEPLOY_TARGET` | variable | `vps` |
| `MEDIA_PUBLIC_URL` | variable | same as `S3_PUBLIC_URL` |
| `APP_URL` | variable | `https://<domain>` (checked after each release) |
| `VPS_HOST` | secret | server IP |
| `VPS_USER` | secret | `deploy` |
| `VPS_SSH_KEY` | secret | contents of `ncs-deploy` (private key) |
| `VPS_KNOWN_HOSTS` | secret | host key line printed by `bootstrap.sh` |

**3. Release.** Every green CI run on `main` deploys (or run *Deploy to VPS* by hand). Each
release takes a pre-deploy backup, runs migrations, starts the new app containers next to the
old ones and switches over once they are healthy, so there is no downtime. A release that never
becomes healthy is discarded and the old one keeps serving. To go back one release:

```bash
ssh deploy@SERVER 'cd /opt/ncs && infra/vps/deploy.sh rollback'
```

**First release only:**

```bash
cd /opt/ncs
docker compose -f docker-compose.prod.yml --env-file .env.production exec app node seed.mjs
docker compose -f docker-compose.prod.yml --env-file .env.production exec app node create-admin.mjs owner@ncsanthanam.in "Owner" 'long-password'
```

- **HTTPS.** Caddy gets certificates automatically and balances across app replicas, health-checking `/api/ready`.
- **Scaling.** Set `APP_REPLICAS` / `WORKER_REPLICAS` in `.env.production`; the next release applies them.
- **Migrations.** These are forward-only, so a rollback keeps the newer schema. Keep migrations backward-compatible: add first, remove in a later release.
- **Backups.** A nightly `pg_dump` (02:30 IST) is kept for 14 days on the server and, when `BACKUP_S3_*` is set, also uploaded to a private bucket (DigitalOcean Spaces, S3 or R2) for 30 days. Set `BACKUP_PING_URL` to be alerted when a backup fails or is missed.
- **Media.** Use AWS S3, DigitalOcean Spaces, Cloudflare R2, or the bundled SeaweedFS (`COMPOSE_PROFILES=selfhosted-storage`; copy `infra/seaweedfs/s3.prod.example.json` to `s3.prod.json` with new keys).

Restore a backup (stop the app first so nothing writes during the restore):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T backup   sh -c 'pg_restore -d "$PGDATABASE" --clean --if-exists --no-owner /backups/ncs-<timestamp>.dump'
```

### Option B — AWS (Terraform + GitHub Actions)

`infra/terraform/aws` provisions:
- networking: a VPC across two AZs and an ALB with WAF;
- compute: ECS Fargate services for app and worker, with autoscaling;
- data: Multi-AZ RDS PostgreSQL 17 behind RDS Proxy, ElastiCache Redis (TLS, auth token, failover), and S3 with CloudFront for media;
- operations: Secrets Manager, ECR, SES, and CloudWatch alarms to email.

```bash
cd infra/terraform/aws
cp terraform.tfvars.example terraform.tfvars     # domain, Route 53 zone, alarm email
# put Razorpay/MSG91/Google keys in secrets.auto.tfvars (git-ignored)
terraform init && terraform apply
```

Then configure the GitHub repository using the variables listed at the top of `.github/workflows/deploy.yml`. From then on, every green CI run on `main` deploys:
1. build and push the images;
2. run migrations as a one-off ECS task;
3. roll out the app and worker, rolling back automatically if they fail.

## Operations

- **Health.** `/api/health` is liveness and `/api/ready` checks Postgres and Redis. The worker serves its health check on port 3001.
- **Logs.** Logs are structured JSON on stdout, with secrets and OTPs redacted. Every admin change is in **Admin → Audit log**.
- **Razorpay webhook.** Point it at `https://<domain>/api/webhooks/razorpay` and subscribe to `payment.captured`, `payment.failed`, `order.paid`, `refund.processed` and `refund.failed`. Its secret goes in `RAZORPAY_WEBHOOK_SECRET`.
- **SMS.** MSG91 needs DLT-registered templates. The OTP template must expose an `otp` variable, and the order template an `order` variable.
- **Store details.** Contact phone, WhatsApp, emails, GSTIN and address are edited in **Admin → Store & shipping**; nothing is hard-coded.

### Before going live, the business must supply

- [ ] **GSTIN**, and confirmation of the GST rate and HSN code for each category (the seed defaults to 5%, HSN 5007).
- [ ] The real phone and WhatsApp numbers and support emails, entered in Admin → Store & shipping.
- [ ] Razorpay live keys and webhook secret, an MSG91 account with approved DLT templates, and an SES-verified sending domain.
- [ ] Optionally, a Google OAuth client for "Continue with Google".
- [ ] A review of the marketing claims on the homepage and About page ("10,000+ brides", "Est. 1975", etc.) and of the policy pages.
- [ ] Real product photography. Several catalog images are AI-generated placeholders.
