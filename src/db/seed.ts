import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  // Loaded dynamically so `config()` above populates process.env.DATABASE_URL
  // before src/db/index.ts reads it at module-evaluation time — a static
  // top-of-file import would be hoisted ahead of the config() call.
  const { db } = await import('./index');
  const { adminUsers } = await import('./schema');

  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing.length > 0) {
    console.log(`Admin ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminUsers).values({ name, email, passwordHash });
  console.log(`Created admin ${email}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
