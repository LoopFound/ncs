# Launch Readiness

Measured on 2 November 2026 with Lighthouse's default mobile settings (simulated slow 4G and CPU slowdown) against a local production build in headless Chrome. Re-run these checks on the deployed site, because hosting and CDN affect the speed results.

## Results

Each cell shows before → after the launch-readiness fixes.

| Page | Performance | Accessibility | Best practices | SEO | Largest Contentful Paint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | 57 → 81 | 98 → 100 | 100 | 100 | 22.9 s → 4.6 s |
| `/shop` | 66 → 84 | 98 → 100 | 100 | 100 | 38.6 s → 4.4 s |
| `/shop/product/p1` | 65 → 84 | 98 → 100 | 100 | 100 | 19.2 s → 4.4 s |
| `/collections` | 80 → 88 | 98 → 100 | 100 | 100 | 4.0 s → 3.9 s |
| `/contact` | 70 → 79 | 98 → 100 | 100 | 100 | 6.4 s → 5.4 s |

Layout shift was 0 on every page. Total blocking time is now 60–200 ms.

## Against the plan's targets

| Target | Status |
| :--- | :--- |
| Mobile Lighthouse score of at least 90 | **Not met.** Pages score 79–88, held back by Largest Contentful Paint. |
| Page load under 3 seconds | **Not met** in this test. Largest Contentful Paint is 3.9–5.4 s. |
| WCAG AA | **Not confirmed.** Automated checks pass, but they cover only part of WCAG. Keyboard and screen reader testing is still needed. |
| Optimized metadata and schema | **Met**, once the site URL below is confirmed. Pages have unique titles and descriptions, and products have Product schema. |

## Search listing

- `robots.txt` and `sitemap.xml` are now served. The sitemap lists 39 URLs.
- Cart, checkout, login and order confirmation are excluded from search.
- Google Search Console has not been set up, so real indexing is unmeasured.

## Before launch

1. Set `NEXT_PUBLIC_SITE_URL` to the real domain. The fallback, `https://ncsanthanam.in`, is inferred from the contact email.
2. Reduce Largest Contentful Paint to reach the 90 target. Start with the page-entry animations, which hide the main content until they run, then compress the source images.
3. Audit `/cart` and `/checkout` with items in the bag. They were not measured, and their thumbnails still load full-size images.
4. Test with a keyboard and a screen reader.
