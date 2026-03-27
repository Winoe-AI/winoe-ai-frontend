import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './next.config.csp';

const isProd = process.env.NODE_ENV === 'production';
const isDeployProd =
  process.env.VERCEL_ENV === 'production' ||
  process.env.TENON_DEPLOY_ENV === 'production';
const securityHeaders = buildSecurityHeaders(isProd, isDeployProd);

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
