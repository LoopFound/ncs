# NCS Santhanam Storefront

Next.js storefront for NCS Santhanam. It is currently static: the catalog comes from `src/data/mock.ts` and the cart is stored in the browser.

## Requirements

Node.js 24 (see `.nvmrc`). No environment variables are required.

## Commands

```bash
npm ci             # install exactly what the lockfile specifies
npm run dev        # local server at http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

Pull requests that touch `frontend/` run all of these, plus a production dependency audit, in `.github/workflows/frontend.yml`.

## TypeScript setup

`tsc` runs TypeScript 7 through the `@typescript/native` alias. The `typescript` package is aliased to `@typescript/typescript6` because typescript-eslint does not support TypeScript 7 yet. Remove both aliases once it does.

## Updating dependencies

Update major versions in their own pull request, and do not adopt prereleases. Keep `prisma` and `@prisma/client` on the same version.

## Not connected yet

Checkout and login do not reach a server, so no real order, payment or sign-in happens. The contact form hands off to the visitor's email app, and newsletter sign-up is disabled.
