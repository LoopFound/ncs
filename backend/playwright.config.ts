import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE, e2eEnv } from "./tests/e2e/env";

/**
 * Browser tests run against the standalone production build (`npm run build` first) plus the worker,
 * on an isolated database prepared by tests/e2e/prepare.ts.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: E2E_BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "node .next/standalone/server.js",
      url: `${E2E_BASE}/api/ready`,
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node node_modules/tsx/dist/cli.mjs src/worker/index.ts",
      url: "http://localhost:3201/",
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
