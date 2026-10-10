// Copies static assets next to the standalone server (Next.js leaves this to the deployer).
import { cpSync, existsSync } from "node:fs";

const out = ".next/standalone";
if (!existsSync(`${out}/server.js`)) {
  console.error("No standalone build found — run `next build` first.");
  process.exit(1);
}
cpSync("public", `${out}/public`, { recursive: true });
cpSync(".next/static", `${out}/.next/static`, { recursive: true });
console.log("standalone build ready: node .next/standalone/server.js");
