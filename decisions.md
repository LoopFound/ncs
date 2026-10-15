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

## 2026-10-14 — Align deployed login with backend UI

- **What changed:** Rebuilt the frontend login page with the backend login composition, local bridal imagery, sign-in, account creation, password reset, and mobile OTP modes. Added a route-aware site chrome wrapper so `/login` renders without the storefront header and footer while all other frontend routes retain them.
- **Why:** The deployed frontend showed an obsolete demo form, external imagery, clipped overlay text, and storefront chrome that did not match the correct local backend login.
- **Why this method:** Reused existing React, Next.js Image, Tailwind, and project design tokens instead of adding another form or UI library. A small route-aware wrapper preserves every existing storefront route without a broad route-group move, while the static frontend stays independent until a public backend authentication URL exists.

## 2026-10-14 — Close stale pre-separation dependency PRs

- **What changed:** Audited and closed all 10 open pull requests (#2–#11). Each PR received a comment explaining that it became stale after the frontend/backend separation.
- **Why:** Every PR was created by Dependabot before the repository restructure and GitHub reported every one as `CONFLICTING` with a `DIRTY` merge state. PRs #2–#6 modified the removed `ncs-santhanam/package.json` and lockfile. PRs #7–#11 modified root GitHub Actions workflows that no longer exist.
- **Why this method:** Closed the obsolete PRs instead of resolving conflicts into deleted paths. Any still-needed upgrade should be recreated against the current `frontend/` or `backend/` owner, which keeps dependency changes reviewable and prevents restoring retired structure.

### Closed PR inventory

| PR | Update | Obsolete target |
| --- | --- | --- |
| #2 | Six minor and patch npm updates | `ncs-santhanam` manifests |
| #3 | ESLint 9 to 10 | `ncs-santhanam` manifests |
| #4 | Framer Motion 12 to 14 | `ncs-santhanam` manifests |
| #5 | TypeScript 5 to 7 | `ncs-santhanam` manifests; CI failed before closure |
| #6 | Node type definitions 24 to 26 | `ncs-santhanam` manifests |
| #7 | AWS credentials action 4 to 6 | Deleted AWS deployment workflow |
| #8 | Terraform setup action 3 to 4 | Deleted root workflows |
| #9 | Checkout action 4 to 7 | Deleted root workflows |
| #10 | Docker build action 6 to 7 | Deleted root workflows |
| #11 | Node setup action 4 to 7 | Deleted root CI workflow |

## 2026-10-15 — Use supplied textile artwork in homepage hero

- **What changed:** Replaced the hero's generic grid ambience with the supplied `imagehero.avif` textile artwork, layered beneath navy readability gradients and the existing gold glow. The image is decorative and hidden from assistive technology.
- **Why:** The supplied purple, crimson, and gold Kanchipuram border pattern gives the hero the requested traditional silk identity while preserving existing copy, product imagery, controls, and calls to action.
- **Why this method:** Reused Next.js `Image` and existing Tailwind utilities instead of flattening the full hero into an image or adding CSS-generated ornamentation. This keeps text accessible, preserves responsive layout, and lets Next.js optimize the supplied asset.

## 2026-10-15 — Keep desktop navigation visible without dropdowns

- **What changed:** Exposed the full primary navigation from the `xl` desktop breakpoint, removed the Kanchipuram dropdown and its nested options, and compacted header spacing and account actions to fit the 1280px desktop layout.
- **Why:** Desktop users need immediate access to primary collection options in the header. The dropdown added unnecessary interaction and the previous `2xl` breakpoint showed a mobile menu on common desktop widths.
- **Why this method:** Simplified the existing navigation data and responsive classes instead of adding another header variant. Direct links reduce state and interaction complexity while preserving the mobile menu below the desktop breakpoint.

## 2026-10-15 — Keep hero product visual free of overlays

- **What changed:** Removed the title card, description, status marker, and Look switcher from the hero product visual. The panel now contains only the primary Kanchipuram saree photograph.
- **Why:** The overlaid card obscured the saree and competed with the hero's main copy. The requested composition gives the product image uninterrupted visual focus.
- **Why this method:** Removed the now-unused state and alternate-look data at their owning component instead of hiding controls with CSS. This keeps the rendered UI and component logic consistent.

## 2026-10-15 — Rebalance responsive hero composition

- **What changed:** Reduced the hero heading scale at constrained desktop widths, established a deliberate two-column ratio, tightened vertical rhythm, and gave the saree photograph a consistent responsive frame with a restrained border, shadow, and image-only treatment.
- **Why:** Live review at 1280px showed the headline wrapping into an oversized four-line block and overpowering the saree visual. The revised composition keeps both story and product visible within the first viewport.
- **Why this method:** Adjusted the existing Tailwind layout and type scale instead of restructuring the page or adding dependencies. Responsive `clamp` sizing and current breakpoints preserve the established component while fixing the actual balance problem.

## 2026-10-15 — Replace root quickstart with full workflow guide

- **What changed:** Expanded the root README with repository architecture, separate frontend and backend setup, environment and service ownership, database workflow, commands, testing, common change processes, deployment paths, launch gates, and troubleshooting.
- **Why:** The previous README explained only the minimum startup commands and required readers to infer how the two applications, worker, infrastructure, and release process fit together.
- **Why this method:** Kept one simplified repository entry point and linked to the detailed backend operations guide instead of duplicating every production command. Tables, ordered processes, and copy-ready PowerShell commands make the guide usable without adding documentation tooling.
