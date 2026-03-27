function safeCspOrigin(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
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

function buildCspHeader(isProd: boolean) {
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

export function buildSecurityHeaders(isProd: boolean, isDeployProd: boolean) {
  return [
    {
      key: 'Content-Security-Policy-Report-Only',
      value: buildCspHeader(isProd),
    },
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
}
