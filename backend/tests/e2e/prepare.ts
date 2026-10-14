/**
 * Prepares an isolated database for browser tests: create → migrate → seed → admin user.
 * Runs before Playwright starts the app (see the test:e2e script).
 */
import { execFileSync } from "node:child_process";
import pg from "pg";
import { Redis } from "ioredis";
import { ADMIN, e2eEnv } from "./env";

async function main() {
  const url = new URL(e2eEnv.DATABASE_URL);
  const dbName = url.pathname.slice(1);
  const adminUrl = new URL(e2eEnv.DATABASE_URL);
  adminUrl.pathname = "/postgres";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  const env = { ...process.env, ...e2eEnv };
  const run = (args: string[]) => execFileSync(process.execPath, args, { env, stdio: "inherit" });
  run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  run(["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"]);
  run(["node_modules/tsx/dist/cli.mjs", "scripts/create-admin.ts", ADMIN.email, ADMIN.name, ADMIN.password]);

  const redis = new Redis(e2eEnv.REDIS_URL);
  await redis.flushdb();
  await redis.quit();
  console.log(`e2e database ${dbName} ready`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
