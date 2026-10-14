# NCS Santhanam

NCS Santhanam is split into two independently deployable applications.

## Project structure

```text
.
├── frontend/     # Customer-facing Next.js storefront
├── backend/      # Admin, APIs, database, workers, tests, and infrastructure
├── decisions.md  # Engineering decision log
└── README.md
```

## Frontend

The frontend preserves the existing storefront design and uses a static catalog snapshot aligned with `backend/prisma/seed-data.ts`.

```bash
cd frontend
npm ci
npm run dev
```

The development server runs at `http://localhost:3000`.

For Vercel, set the project Root Directory to `frontend`.

## Backend

The backend contains the admin application, API routes, Prisma schema and migrations, background worker, tests, and deployment infrastructure. It requires Node.js 24, PostgreSQL, Redis, and S3-compatible storage.

```bash
cd backend
npm ci
docker compose up -d
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The backend development server runs at `http://localhost:3100`. See [backend/README.md](backend/README.md) for environment setup, tests, and deployment details.

## Decision log

Meaningful code and architecture changes are recorded in [decisions.md](decisions.md).
