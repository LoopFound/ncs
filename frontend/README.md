<div align="center">

# NCS Santhanam

### *Sacred Weaves, Timeless Heirlooms.*

The online storefront for a Kanchipuram silk boutique, est. 1975.

![Next.js](https://img.shields.io/badge/Next.js-16-0B1B4D?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-0B1B4D?style=flat-square&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-0B1B4D?style=flat-square&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-0B1B4D?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-C9A227?style=flat-square&logo=nodedotjs&logoColor=white)

[Quick start](#quick-start) · [Pages](#pages) · [Design](#design) · [Project layout](#project-layout) · [Status](#status) · [Full report (PDF)](docs/NCS-Santhanam-Frontend-Report.pdf)

<br>

<img src="docs/screenshots/home-hero.jpg" alt="NCS Santhanam homepage" width="100%">

</div>

<br>

> [!IMPORTANT]
> This is a preview. Products are sample data, and checkout and sign-in don't take real orders, payments or accounts. See [Status](#status).

## Quick start

You need Node.js 24 (see `.nvmrc`). No environment variables are required.

```bash
npm ci        # install exactly what the lockfile specifies
npm run dev   # local site at http://localhost:3000
```

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Starts the local development site |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Checks types with `tsc` |
| `npm test` | Runs the Vitest unit tests |
| `npm run build` | Creates a production build |
| `npm start` | Serves the production build |

Pull requests that touch `frontend/` run lint, type check, tests and build, plus a production dependency audit, in `.github/workflows/frontend.yml`.

## Pages

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/shop.jpg" alt="Shop listing"><br><b>Shop</b>: every collection shares this listing</td>
    <td width="50%"><img src="docs/screenshots/product.jpg" alt="Product page"><br><b>Product</b>: gallery, craft details and enquiry link</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/cart.jpg" alt="Shopping bag"><br><b>Bag</b>: saved in the browser between visits</td>
    <td><img src="docs/screenshots/checkout.jpg" alt="Checkout"><br><b>Checkout</b>: delivery, customization and payment screens</td>
  </tr>
</table>

| Area | Routes |
| :--- | :--- |
| Home | `/` |
| Collections | `/wedding` `/kanchipuram` `/soft-silk` `/gift-sarees` `/pavadas` `/dupattas` `/mens-corner` `/materials` `/new` `/collections` |
| Kanchipuram | `/kanchipuram/traditional` `/kanchipuram/borderless` `/kanchipuram/fancy-kanjivarams` `/kanchipuram/exclusives` |
| Catalog | `/shop` `/shop/product/[id]` |
| Buying | `/cart` `/checkout` `/order-success` |
| Account | `/login` |
| Brand and help | `/about` `/contact` `/faq` |
| Policies | `/policies/privacy` `/policies/returns` `/policies/shipping` `/policies/terms` |

<details>
<summary><b>On a phone</b></summary>
<br>
<table>
  <tr>
    <td><img src="docs/screenshots/mobile-home.jpg" alt="Home on a phone"></td>
    <td><img src="docs/screenshots/mobile-shop.jpg" alt="Shop on a phone"></td>
    <td><img src="docs/screenshots/mobile-product.jpg" alt="Product on a phone"></td>
  </tr>
</table>
</details>

## Design

<img src="docs/palette.svg" alt="Brand palette" width="100%">

| Royal Navy | Maroon | Temple Gold | Gold Text | Ivory | Silk Cream | Greige |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `#0B1B4D` | `#8B1E2D` | `#C9A227` | `#82600F` | `#FAF7F0` | `#F5F1E8` | `#E9E1D5` |

- **Textile backgrounds:** `SiteChrome` picks a woven motif by route (butta, paisley, lotus, temple or kattam). The newsletter and footer use navy paisley, and zari borders frame screens 1280px and wider.
- **Motion:** Framer Motion handles gentle fades on scroll. Avoid anything that bounces or flashes.
- **Rules:** [`STYLE_GUIDE.md`](STYLE_GUIDE.md) has the type scale, components and tone of voice.

## Project layout

```text
src/
├── app/          # routes, plus loading, error and not-found screens
├── components/   # Header, Footer, SiteChrome, ContactForm
│   ├── home/     # homepage sections
│   └── shop/     # ProductListing, shared by every collection
├── context/      # CartContext, the bag state
├── data/         # mock.ts, the sample catalog
└── lib/          # cart storage and enquiry helpers, with tests
public/           # logo and imagery
docs/             # progress report and README images
```

## Status

| Feature | State |
| :--- | :--- |
| Browsing, product pages and bag | ✅ Working, with sample products |
| Contact form | ✅ Opens the visitor's email app; nothing is sent until they press send |
| Checkout | 🚧 Simulated: empties the bag and shows the confirmation page |
| Login, sign-up and OTP | 🚧 Screens only |
| Newsletter | 🚧 Disabled and marked "Coming Soon" |
| Search and filters | ⬜ Not built |

The [report](docs/NCS-Santhanam-Frontend-Report.pdf) lists everything left to do before launch.

## Maintenance

**TypeScript:** `tsc` runs TypeScript 7 through the `@typescript/native` alias. The `typescript` package is aliased to `@typescript/typescript6` because typescript-eslint does not support TypeScript 7 yet. Remove both aliases once it does.

**Dependencies:** Update major versions in their own pull request, and do not adopt prereleases.
