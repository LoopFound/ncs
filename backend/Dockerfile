# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# NCS Santhanam — production image
#   target "runtime" (default): web server  → node server.js
#                               worker      → node worker.mjs
#                               one-offs    → node seed.mjs | node create-admin.mjs …
#   target "migrate":           database migrations → prisma migrate deploy
# ─────────────────────────────────────────────────────────────

ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# All dependencies (needed to build and to run migrations).
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Production-only dependencies for the runtime image: prune the full install rather than
# installing twice (much lighter on memory, and guaranteed to match the build's versions).
FROM deps AS prod-deps
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public media host baked into next/image's allow-list (e.g. https://dxxxx.cloudfront.net/media).
ARG S3_PUBLIC_URL=""
# Low-memory hosts: --build-arg NEXT_BUILD_FLAGS=--webpack --build-arg NEXT_BUILD_CPUS=1
ARG NEXT_BUILD_FLAGS=""
ARG NEXT_BUILD_CPUS=2
ENV S3_PUBLIC_URL=${S3_PUBLIC_URL} NEXT_BUILD_CPUS=${NEXT_BUILD_CPUS}
RUN npx prisma generate \
 && npx next build ${NEXT_BUILD_FLAGS} \
 && node scripts/prepare-standalone.mjs \
 && npm run worker:build

# Migration runner (has the Prisma CLI; used as a one-off job before each release).
FROM deps AS migrate
COPY prisma ./prisma
COPY prisma.config.ts ./
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next/standalone/server.js ./server.js
COPY --from=build --chown=node:node /app/.next/standalone/.next ./.next
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/dist ./
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${HEALTH_PORT:-3000}/${HEALTH_PATH:-api/health}" || exit 1
CMD ["node", "server.js"]
