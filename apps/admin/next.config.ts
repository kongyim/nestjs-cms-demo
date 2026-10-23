import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import type { NextConfig } from 'next';

// Next loads app-local env files; also support this workspace's shared root .env.
// Already-set environment variables take precedence.
const rootEnv = resolve(__dirname, '../../.env');
if (existsSync(rootEnv)) loadEnvFile(rootEnv);

const basePath = (process.env.ADMIN_BASE_PATH ?? '/admin')
  .trim()
  .replace(/\/+$/, '');
if (basePath && !/^(\/[a-zA-Z0-9_-]+)+$/.test(basePath)) {
  throw new Error(
    'ADMIN_BASE_PATH must be empty or a path such as /admin or /tools/cms.',
  );
}

const nextConfig: NextConfig = {
  basePath,
  // Expose only the public path, not the other values in the shared .env.
  env: { NEXT_PUBLIC_ADMIN_BASE_PATH: basePath },
  async rewrites() {
    return [
      {
        // Next automatically prefixes this source with basePath.
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
