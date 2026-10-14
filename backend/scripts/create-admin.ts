/**
 * Creates (or promotes) an administrator.
 *   npm run admin:create -- owner@ncsanthanam.in "Owner Name" 'a-strong-password'
 * In a container: docker compose run --rm app node scripts/create-admin.js …  (see README)
 */
import { getAuth } from "../src/server/auth";
import { db } from "../src/server/db";

async function main() {
  const [email, name, password] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error('Usage: npm run admin:create -- <email> "<name>" <password>');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Use a password of at least 12 characters for admin accounts.");
    process.exit(1);
  }

  const normalized = email.trim().toLowerCase();
  let user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) {
    await getAuth().api.signUpEmail({ body: { email: normalized, name, password } });
    user = await db.user.findUniqueOrThrow({ where: { email: normalized } });
  }
  await db.user.update({ where: { id: user.id }, data: { role: "admin", emailVerified: true, banned: false } });
  console.log(`✔ ${normalized} is now an admin. Sign in at /login, then open /admin.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
