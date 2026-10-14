# Engineering Decisions

This file records meaningful code changes made during Codex sessions. Each entry explains what changed, why the approach fits, and why the chosen method or library was preferred over alternatives.

## 2026-10-13 — Preserve latest storefront while integrating production backend

- **What changed:** Resolved `main` versus `feat/production-launch` conflicts by retaining database-backed header, footer, product cards, and route group. Ported latest `main` navigation breakpoints, accessible touch targets, non-home header background, responsive footer layout, and carousel removal into those production components. Kept strict TypeScript build failures enabled.
- **Why:** Backend branch replaces static storefront data and legacy routes, while later `main` commits contain intentional frontend usability fixes. Combining both preserves current design behavior without discarding production services.
- **Why this method:** Adapted existing React, Next.js, Tailwind, and server-service patterns instead of restoring static components or adding another UI library. Existing components own these behaviors and avoid duplicate routes, data sources, and dependencies.

## 2026-10-13 — Separate frontend and backend by branch

- **What changed:** Restored `main` to the frontend-only state from commit `b0529c1`. Kept the production backend and full-stack implementation unchanged on `feat/production-launch` at commit `16b1850`.
- **Why:** The merged full-stack deployment requires backend runtime services and production environment configuration, causing the currently hosted storefront to return an internal server error. Branch separation restores the working frontend while preserving all backend work.
- **Why this method:** Used a normal revert commit instead of rewriting Git history, deleting backend code, or creating duplicate folders. This keeps rollback simple, preserves review history, and lets frontend and backend deploy independently for now.

## 2026-10-13 — Split deployable code into frontend and backend folders

- **What changed:** Moved the preserved static storefront into `frontend/` and the production API, admin, database, worker, tests, and infrastructure into `backend/`. Removed the obsolete `ncs-santhanam` project path, root lockfile, and generated diagnostics from the frontend.
- **Why:** Each application now has its own package manifest, lockfile, source tree, and deployment root. This prevents the storefront deployment from starting backend code that requires PostgreSQL, Redis, and other production services.
- **Why this method:** Used two self-contained Next.js projects instead of workspaces or cross-folder imports. Independent project roots are simpler for separate deployments and avoid coupling frontend availability to backend runtime configuration.

## 2026-10-13 — Align frontend catalog facts with backend seed

- **What changed:** Kept stable frontend product route IDs while aligning catalog image order and product facts with `backend/prisma/seed-data.ts`. Added a source note beside the frontend snapshot.
- **Why:** The frontend must remain independently deployable, but product information should match the backend source instead of drifting mock content.
- **Why this method:** Copied a static snapshot rather than importing backend code at build time or adding an API dependency. This preserves the old frontend behavior and makes backend downtime unable to break catalog pages.

## 2026-10-14 — Add repository-level documentation

- **What changed:** Added a root `README.md` describing the frontend/backend layout, local startup commands, deployment roots, and links to detailed backend documentation and the decision log.
- **Why:** GitHub visitors need an immediate explanation of the two-project structure without opening either application folder first.
- **Why this method:** Kept a concise root overview and linked to the existing backend guide instead of duplicating its full operations documentation. This gives clear entry points while avoiding documentation drift.
