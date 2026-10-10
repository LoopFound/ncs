// k6 load test for the read-heavy storefront paths.
//   k6 run -e BASE_URL=https://staging.ncsanthanam.in tests/load/browse.js
// Never point this at production during business hours.
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3100";

export const options = {
  scenarios: {
    shoppers: {
      executor: "ramping-vus",
      stages: [
        { duration: "1m", target: 25 },
        { duration: "3m", target: 100 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    "http_req_duration{page:product}": ["p(95)<800"],
    "http_req_duration{page:suggest}": ["p(95)<300"],
  },
};

const categories = ["/wedding", "/kanchipuram", "/kanchipuram/traditional", "/soft-silk", "/gift-sarees"];
const products = ["royal-kanchipuram-silk", "classic-gold-border-pattu", "bridal-red-samudrika", "thousand-butta-kanjivaram", "soft-silk-pastel-dreams"];
const terms = ["kor", "bridal", "silk", "green", "temple"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function shopperSession() {
  group("home", () => {
    const res = http.get(`${BASE}/`, { tags: { page: "home" } });
    check(res, { "home 200": (r) => r.status === 200 });
  });
  sleep(1);

  group("category", () => {
    const res = http.get(`${BASE}${pick(categories)}?sort=price-asc`, { tags: { page: "category" } });
    check(res, { "category 200": (r) => r.status === 200 });
  });
  sleep(1);

  group("search", () => {
    // Suggestions are rate-limited per IP; from a single load generator 429s are expected.
    const res = http.get(`${BASE}/api/search/suggest?q=${pick(terms)}`, {
      tags: { page: "suggest" },
      responseCallback: http.expectedStatuses(200, 429),
    });
    check(res, { "suggest ok": (r) => r.status === 200 || r.status === 429 });
  });

  group("product", () => {
    const res = http.get(`${BASE}/shop/${pick(products)}`, { tags: { page: "product" } });
    check(res, { "product 200": (r) => r.status === 200 });
  });
  sleep(2);

  group("cart", () => {
    const res = http.get(`${BASE}/api/cart`, { tags: { page: "cart" } });
    check(res, { "cart 200": (r) => r.status === 200 });
  });
  sleep(1);
}
