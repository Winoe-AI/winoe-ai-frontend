const SESSION_PATH_PREFIX = '/candidate/session/';
const LEGACY_SESSION_PATH_PREFIX = '/candidate-sessions/';

function decodePathToken(rawToken: string): string | null {
  const trimmed = rawToken.trim();
  if (!trimmed) return null;
  try {
    const decoded = decodeURIComponent(trimmed).trim();
    return decoded ? decoded : null;
  } catch {
    return null;
  }
}

function routeTokenFromPathname(pathname: string): string | null {
  const prefixes = [SESSION_PATH_PREFIX, LEGACY_SESSION_PATH_PREFIX];
  for (const prefix of prefixes) {
    if (!pathname.startsWith(prefix)) continue;
    const rawToken = pathname.slice(prefix.length).split('/')[0] ?? '';
    return decodePathToken(rawToken);
  }
  return null;
}

export function activeRouteToken(): string | null {
  if (typeof window === 'undefined') return null;
  return routeTokenFromPathname(window.location.pathname);
}
