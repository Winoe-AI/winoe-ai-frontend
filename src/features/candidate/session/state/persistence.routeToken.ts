const SESSION_PATH_PREFIX = '/candidate/session/';

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
  if (!pathname.startsWith(SESSION_PATH_PREFIX)) return null;
  const rawToken =
    pathname.slice(SESSION_PATH_PREFIX.length).split('/')[0] ?? '';
  return decodePathToken(rawToken);
}

export function activeRouteToken(): string | null {
  if (typeof window === 'undefined') return null;
  return routeTokenFromPathname(window.location.pathname);
}
