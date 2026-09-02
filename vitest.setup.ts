import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { config } from 'dotenv';
import { setDefaultResultOrder } from 'node:dns';

config({ path: '.env.local' });

// Local-dev-only workaround: on networks where outbound IPv6 is broken or very
// slow, Node's default dual-stack DNS resolution wastes each connection's
// timeout budget trying IPv6 addresses to Neon's endpoint before ever falling
// back to IPv4, producing a reproducible ConnectTimeoutError under the many
// concurrent requests this integration-test suite makes. This does not affect
// the deployed app (Vercel's network doesn't have this problem) — it's scoped
// to the local test runner only, not application source under src/.
setDefaultResultOrder('ipv4first');

afterEach(() => {
  cleanup();
});
