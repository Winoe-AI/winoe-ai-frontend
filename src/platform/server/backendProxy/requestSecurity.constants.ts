import type { MethodRule, ProxyMethod } from './requestSecurity.types';

export const STATE_CHANGING_METHODS = new Set<ProxyMethod>([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

export const MUTATION_HINT_SEGMENTS = new Set([
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

export const METHOD_RULES: MethodRule[] = [
  { pattern: /^candidate\/invites$/, methods: ['GET', 'HEAD'] },
  { pattern: /^candidate\/session\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^candidate\/session\/[^/]+\/schedule$/, methods: ['POST'] },
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
  { pattern: /^tasks\/[^/]+\/codespace\/status$/, methods: ['GET', 'HEAD'] },
  { pattern: /^tasks\/[^/]+\/draft$/, methods: ['GET', 'HEAD', 'PUT'] },
  { pattern: /^tasks\/[^/]+\/handoff\/upload\/init$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/upload\/complete$/, methods: ['POST'] },
  { pattern: /^tasks\/[^/]+\/handoff\/status$/, methods: ['GET', 'HEAD'] },
  { pattern: /^recordings\/[^/]+\/delete$/, methods: ['POST'] },
  { pattern: /^trials$/, methods: ['GET', 'HEAD', 'POST'] },
  { pattern: /^trials\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^trials\/[^/]+\/candidates$/, methods: ['GET', 'HEAD'] },
  {
    pattern: /^trials\/[^/]+\/candidates\/compare$/,
    methods: ['GET', 'HEAD'],
  },
  { pattern: /^trials\/[^/]+\/invite$/, methods: ['POST'] },
  { pattern: /^trials\/[^/]+\/terminate$/, methods: ['POST'] },
  {
    pattern: /^trials\/[^/]+\/candidates\/[^/]+\/invite\/resend$/,
    methods: ['POST'],
  },
  {
    pattern: /^candidate_sessions\/[^/]+\/winoe_report$/,
    methods: ['GET', 'HEAD'],
  },
  {
    pattern: /^candidate_sessions\/[^/]+\/winoe_report\/generate$/,
    methods: ['POST'],
  },
  { pattern: /^submissions$/, methods: ['GET', 'HEAD'] },
  { pattern: /^submissions\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^jobs\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^backend\/jobs\/[^/]+$/, methods: ['GET', 'HEAD'] },
  { pattern: /^backend\/trials\/[^/]+\/activate$/, methods: ['POST'] },
  {
    pattern: /^backend\/trials\/[^/]+\/scenario\/[^/]+\/approve$/,
    methods: ['POST'],
  },
  {
    pattern: /^backend\/trials\/[^/]+\/scenario\/regenerate$/,
    methods: ['POST'],
  },
  {
    pattern: /^backend\/trials\/[^/]+\/scenario\/[^/]+$/,
    methods: ['PATCH'],
  },
];
