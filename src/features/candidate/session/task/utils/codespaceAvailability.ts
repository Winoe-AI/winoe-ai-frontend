import type { WorkspaceLoadResult } from './workspaceResponses';

export type CodespaceAvailability =
  | 'ready'
  | 'not_ready'
  | 'unavailable'
  | 'error';

export type CodespaceFallbackReason =
  | 'unavailable'
  | 'not_ready_timeout'
  | 'init_error';

export const CODESPACE_NOT_READY_POLL_INTERVAL_MS = 4000;
export const CODESPACE_NOT_READY_MAX_POLLS = 3;

const UNAVAILABLE_SIGNALS = [
  'UNAVAILABLE',
  'DISABLED',
  'RESTRICTED',
  'POLICY',
  'BLOCKED',
  'FORBIDDEN',
  'DENIED',
  'NOT_ALLOWED',
  'NOT_PERMITTED',
  'UNSUPPORTED',
  'UNHEALTHY',
];

const NOT_READY_SIGNALS = [
  'NOT_READY',
  'PENDING',
  'PROVISION',
  'STARTING',
  'CREATING',
  'INITIALIZING',
  'IN_PROGRESS',
  'QUEUED',
  'WAITING',
  'BOOTING',
];

function normalizeSignal(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

function hasAnySignal(value: string, signals: string[]): boolean {
  if (!value) return false;
  return signals.some((signal) => value.includes(signal));
}

function isUnavailableSignal(value: string): boolean {
  return hasAnySignal(value, UNAVAILABLE_SIGNALS);
}

function isNotReadySignal(value: string): boolean {
  return hasAnySignal(value, NOT_READY_SIGNALS);
}

function hasRepoIdentity(result: WorkspaceLoadResult): boolean {
  return Boolean(
    result.workspace?.repoUrl ||
    result.workspace?.repoName ||
    result.workspace?.repoFullName,
  );
}

export function classifyCodespaceAvailability(
  result: WorkspaceLoadResult,
): CodespaceAvailability {
  if (result.workspace?.codespaceUrl) return 'ready';

  const stateSignal = normalizeSignal(
    result.codespaceState ?? result.workspace?.codespaceState,
  );
  if (isUnavailableSignal(stateSignal)) return 'unavailable';
  if (isNotReadySignal(stateSignal)) return 'not_ready';

  const errorCodeSignal = normalizeSignal(result.errorCode);
  const errorMessageSignal = normalizeSignal(result.error);
  if (
    isUnavailableSignal(errorCodeSignal) ||
    isUnavailableSignal(errorMessageSignal)
  ) {
    return 'unavailable';
  }

  if (result.error) return 'error';
  if (hasRepoIdentity(result)) return 'not_ready';
  return 'not_ready';
}
