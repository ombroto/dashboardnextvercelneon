import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { signIn } from '@/lib/auth';

describe('admin credentials auth', () => {
  const email = 'test-auth@bpip.go.id';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('secret-pass-1', 10);
    await db.insert(adminUsers).values({ name: 'Test Admin', email, passwordHash });
  });

  afterAll(async () => {
    await db.delete(adminUsers).where(eq(adminUsers.email, email));
  });

  it('rejects an unknown email without throwing', async () => {
    await expect(
      signIn('credentials', { email: 'nobody@bpip.go.id', password: 'whatever', redirect: false })
    ).rejects.toThrow();
  });
});
