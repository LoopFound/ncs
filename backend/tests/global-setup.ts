import { execFileSync } from "node:child_process";
import pg from "pg";
import { TEST_DATABASE_URL, testEnv } from "./test-env";

/** Creates the test database if needed and applies all migrations to it. */
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);
  const admin = new URL(TEST_DATABASE_URL);
  admin.pathname = "/postgres";

  const client = new pg.Client({ connectionString: admin.toString(), connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(`Integration tests need Postgres at ${admin.host}; run \`docker compose up -d\` first. (${(err as Error).message})`);
  }
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
  await client.end();

  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: { ...process.env, ...testEnv },
    stdio: "pipe",
  });
}
