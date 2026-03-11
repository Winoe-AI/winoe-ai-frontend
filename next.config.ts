import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const isDeployProd =
  process.env.VERCEL_ENV === 'production' ||
  process.env.TENON_DEPLOY_ENV === 'production';

function safeCspOrigin(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function parseCspOrigins(value?: string | null): string[] {
  if (!value) return [];
  const tokens = value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const origins = new Set<string>();
  for (const token of tokens) {
    const origin = safeCspOrigin(token);
    if (origin) origins.add(origin);
  }
  return Array.from(origins);
}

function buildCspHeader() {
  const connectSrc = new Set<string>(["'self'"]);
  const imgSrc = new Set<string>(["'self'", 'data:', 'blob:', 'https:']);
  const mediaSrc = new Set<string>(["'self'", 'blob:', 'data:']);
  const apiBase = safeCspOrigin(process.env.NEXT_PUBLIC_TENON_API_BASE_URL);
  if (apiBase) {
    connectSrc.add(apiBase);
    imgSrc.add(apiBase);
    mediaSrc.add(apiBase);
  }
  const auth0Domain = process.env.TENON_AUTH0_DOMAIN;
  if (auth0Domain) {
    const auth0Origin = safeCspOrigin(
      auth0Domain.startsWith('http') ? auth0Domain : `https://${auth0Domain}`,
    );
    if (auth0Origin) connectSrc.add(auth0Origin);
  }
  const mediaOrigins = new Set<string>([
    ...parseCspOrigins(process.env.NEXT_PUBLIC_TENON_MEDIA_ALLOWED_ORIGINS),
  ]);
  if (!isProd) {
    mediaOrigins.add('http://127.0.0.1:9000');
    mediaOrigins.add('http://localhost:9000');
  }
  for (const origin of mediaOrigins) {
    connectSrc.add(origin);
    imgSrc.add(origin);
    mediaSrc.add(origin);
  }

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (!isProd) scriptSrc.push("'unsafe-eval'");

  const policy = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${Array.from(imgSrc).join(' ')}`,
    `media-src ${Array.from(mediaSrc).join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSrc).join(' ')}`,
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isProd) policy.push('upgrade-insecure-requests');

  return policy.join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: buildCspHeader() },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  ...(isDeployProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'remark-breaks'],
  async rewrites() {
    // API proxying is handled explicitly in /app/api/backend/[...path] to avoid
    // catch-all rewrites shadowing BFF route handlers.
    return [];
  },
  async headers() {
    return [
      {
        source:
          '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
        headers: securityHeaders,
      },
    ];
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled:
    (process.env.ANALYZE ?? '').toLowerCase() === 'true' ||
    (process.env.ANALYZE ?? '') === '1',
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
