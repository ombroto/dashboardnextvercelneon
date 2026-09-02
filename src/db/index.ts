import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  try {
    const url = new URL(connectionString);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL URL (for example, postgresql://...). Check the Vercel environment variable.',
    );
  }

  return drizzle(neon(connectionString), { schema });
}

type Database = ReturnType<typeof createDb>;
let instance: Database | undefined;

function getDb(): Database {
  instance ??= createDb();
  return instance;
}

// Keep database setup out of module evaluation. Next.js imports route modules
// while building, but DATABASE_URL is only needed when a request runs.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const value = Reflect.get(getDb(), property);
    return typeof value === 'function' ? value.bind(getDb()) : value;
  },
});
