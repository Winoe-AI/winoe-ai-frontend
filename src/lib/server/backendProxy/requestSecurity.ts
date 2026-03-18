import { NextRequest, NextResponse } from 'next/server';
import { REQUEST_ID_HEADER, UPSTREAM_HEADER } from '@/lib/server/bff';

type ProxyMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type MethodRule = {
  pattern: RegExp;
  methods: readonly ProxyMethod[];
};

const STATE_CHANGING_METHODS = new Set<ProxyMethod>([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

const MUTATION_HINT_SEGMENTS = new Set([
  'activate',
  'approve',
  'complete',
  'consent',
  'delete',
  'generate',
  'init',
  'invite',
  'regenerate',
  'resend',
  'retry',
  'run',
  'schedule',
  'submit',
  'terminate',
]);

const METHOD_RULES: MethodRule[] = [
  { pattern: /^candidate\/invites$/, methods: ['GET', 'HEAD'] },
  { pattern: /^candidate\/session\/[^/]+$/, methods: ['GET', 'HEAD'] },
  {
    pattern: /^candidate\/session\/[^/]+\/schedule$/,
    methods: ['POST'],
  },
  {
    pattern: /^candidate\/session\/[^/]+\/current_task$/,
    methods: ['GET', 'HEAD'],
  },
  {
    pattern: /^candidate\/session\/[^/]+\/privacy\/consent$/,
    methods: ['POST'],
  },
  { pattern: /^tasks\/[^/]+\/run$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/run\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^tasks\/[^/]+\/submit$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/codespace\/init$/, methods: ['POST'] },
  {
    pattern: /^tasks\/[^/]+\/codespace\/status$/,
    methods: ['GET', 'HEAD'],
  },
  { pattern: /^tasks\/[^/]+\/draft$/, methods: ['GET', 'HEAD', 'PUT'] },
  { pattern: /^tasks\/[^/]+\/handoff\/upload\/init$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/upload\/consent$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/upload\/complete$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/consent$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/status$/, methods: ['GET', 'HEAD'] },
  { pattern: /^tasks\/[^/]+\/handoff$/, methods: ['DELETE'] },
  { pattern: /^tasks\/[^/]+\/handoff\/delete$/, methods: ['POST'] },
  { pattern: /^recordings\/[^/]+\/delete$/, methods: ['POST'] },
  { pattern: /^simulations$/, methods: ['GET', 'HEAD', 'POST'] },
  { pattern: /^simulations\/[^/]+$/, methods: ['GET', 'HEAD'] },
  {
    pattern: /^simulations\/[^/]+\/candidates$/,
    methods: ['GET', 'HEAD'],
  },
  {
    pattern: /^simulations\/[^/]+\/candidates\/compare$/,
    methods: ['GET', 'HEAD'],
  },
  { pattern: /^simulations\/[^/]+\/invite$/, methods: ['POST'] },
  { pattern: /^simulations\/[^/]+\/terminate$/, methods: ['POST'] },
  {
    pattern: /^simulations\/[^/]+\/candidates\/[^/]+\/invite\/resend$/,
    methods: ['POST'],
  },
  {
    pattern: /^candidate_sessions\/[^/]+\/fit_profile$/,
    methods: ['GET', 'HEAD'],
  },
  {
    pattern: /^candidate_sessions\/[^/]+\/fit_profile\/generate$/,
    methods: ['POST'],
  },
  { pattern: /^submissions$/, methods: ['GET', 'HEAD'] },
  { pattern: /^submissions\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^jobs\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^backend\/jobs\/[^/]+$/, methods: ['GET', 'HEAD'] },
  {
    pattern: /^backend\/simulations\/[^/]+\/activate$/,
    methods: ['POST'],
  },
  {
    pattern: /^backend\/simulations\/[^/]+\/scenario\/[^/]+\/approve$/,
    methods: ['POST'],
  },
  {
    pattern: /^backend\/simulations\/[^/]+\/scenario\/regenerate$/,
    methods: ['POST'],
  },
  { pattern: /^backend\/simulations\/[^/]+\/regenerate$/, methods: ['POST'] },
  {
    pattern: /^backend\/simulations\/[^/]+\/scenario\/[^/]+$/,
    methods: ['PATCH'],
  },
  {
    pattern: /^backend\/simulations\/[^/]+\/scenario\/retry$/,
    methods: ['POST'],
  },
  {
    pattern: /^backend\/simulations\/[^/]+\/scenario\/generate$/,
    methods: ['POST'],
  },
];

function normalizePath(pathSegments: string[]) {
  return pathSegments
    .map((segment) => {
      try {
        return decodeURIComponent(segment).toLowerCase();
      } catch {
        return segment.toLowerCase();
      }
    })
    .join('/');
}

function methodNotAllowed(allowed: readonly ProxyMethod[], requestId: string) {
  return NextResponse.json(
    { message: 'Method Not Allowed' },
    {
      status: 405,
      headers: {
        Allow: allowed.join(', '),
        [REQUEST_ID_HEADER]: requestId,
        [UPSTREAM_HEADER]: '405',
      },
    },
  );
}

function normalizeOrigin(value: string | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.origin.toLowerCase();
  } catch {
    return null;
  }
}

function isLikelyMutationGet(path: string): boolean {
  return path
    .split('/')
    .some((segment) => MUTATION_HINT_SEGMENTS.has(segment.toLowerCase()));
}

export function enforceProxyMethodPolicy(
  method: string,
  pathSegments: string[],
  requestId: string,
) {
  const normalizedMethod = method.toUpperCase() as ProxyMethod;
  const path = normalizePath(pathSegments);
  const rule = METHOD_RULES.find((candidate) => candidate.pattern.test(path));

  if (rule && !rule.methods.includes(normalizedMethod)) {
    return methodNotAllowed(rule.methods, requestId);
  }

  if (!rule && normalizedMethod === 'GET' && isLikelyMutationGet(path)) {
    return methodNotAllowed(['POST', 'PUT', 'PATCH', 'DELETE'], requestId);
  }

  return null;
}

export function enforceMutationSameOrigin(
  req: NextRequest,
  method: string,
  requestId: string,
) {
  const normalizedMethod = method.toUpperCase() as ProxyMethod;
  if (!STATE_CHANGING_METHODS.has(normalizedMethod)) return null;

  const hasCookieAuth = Boolean((req.headers.get('cookie') ?? '').trim());
  if (!hasCookieAuth) return null;

  const expectedOrigin = normalizeOrigin(req.nextUrl.origin);
  const origin = normalizeOrigin(req.headers.get('origin'));
  const refererOrigin = normalizeOrigin(req.headers.get('referer'));
  const observedOrigin = origin ?? refererOrigin;

  if (expectedOrigin && observedOrigin === expectedOrigin) return null;

  return NextResponse.json(
    { message: 'Forbidden' },
    {
      status: 403,
      headers: {
        [REQUEST_ID_HEADER]: requestId,
        [UPSTREAM_HEADER]: '403',
      },
    },
  );
}
