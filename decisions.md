# Engineering Decisions

This file records meaningful code changes made during Codex sessions. Each entry explains what changed, why the approach fits, and why the chosen method or library was preferred over alternatives.

## 2026-10-13 — Preserve latest storefront while integrating production backend

- **What changed:** Resolved `main` versus `feat/production-launch` conflicts by retaining database-backed header, footer, product cards, and route group. Ported latest `main` navigation breakpoints, accessible touch targets, non-home header background, responsive footer layout, and carousel removal into those production components. Kept strict TypeScript build failures enabled.
- **Why:** Backend branch replaces static storefront data and legacy routes, while later `main` commits contain intentional frontend usability fixes. Combining both preserves current design behavior without discarding production services.
- **Why this method:** Adapted existing React, Next.js, Tailwind, and server-service patterns instead of restoring static components or adding another UI library. Existing components own these behaviors and avoid duplicate routes, data sources, and dependencies.
