import type { NextConfig } from 'next';
import { setDefaultResultOrder } from 'node:dns';

// Local-dev workaround, harmless everywhere else: on networks where outbound
// IPv6 is broken or very slow, Node's default dual-stack DNS resolution tries
// IPv6 addresses to Neon's endpoint first, which can hang until the connect
// timeout before ever falling back to IPv4. Preferring IPv4 first costs
// nothing on networks (including Vercel's) where IPv6 works fine.
setDefaultResultOrder('ipv4first');

const nextConfig: NextConfig = {
  serverExternalPackages: ['unzipper'],
};

export default nextConfig;
