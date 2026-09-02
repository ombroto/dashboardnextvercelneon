import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('admin password hashing', () => {
  it('hashes and verifies a password round-trip', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    expect(await bcrypt.compare('correct-horse', hash)).toBe(true);
    expect(await bcrypt.compare('wrong-password', hash)).toBe(false);
  });
});
