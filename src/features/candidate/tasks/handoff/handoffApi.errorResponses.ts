import type { RequestScope } from './handoffApi.types';

export function scopeFallback(scope: RequestScope): string {
  if (scope === 'init') return 'Unable to start upload right now.';
  if (scope === 'complete') return 'Unable to finalize upload right now.';
  if (scope === 'consent') return 'Unable to save consent right now.';
  if (scope === 'delete') return 'Unable to delete upload right now.';
  return 'Unable to load presentation status right now.';
}

export function isEndpointUnavailableStatus(
  status: number | null | undefined,
): boolean {
  if (typeof status !== 'number' || !Number.isFinite(status)) return false;
  return status === 404 || status === 405 || status === 501;
}

type ResolveParams = {
  scope: RequestScope;
  status: number | null;
  errorCode: string | null;
  backendMsg: string | null;
};

export function resolveHandoffErrorOverride({
  scope,
  status,
  errorCode,
  backendMsg,
}: ResolveParams): { status: number; message: string } | null {
  if (status === 404) {
    return {
      status: 404,
      message:
        backendMsg ??
        (scope === 'delete'
          ? 'Upload not found. Refresh and retry.'
          : 'Task not found in this session. Please refresh and retry.'),
    };
  }
  if (status === 409 && errorCode === 'TASK_WINDOW_CLOSED') {
    return {
      status: 409,
      message:
        backendMsg ??
        'This day is currently closed. Video uploads are locked until the window reopens.',
    };
  }
  if (status === 410) {
    return {
      status: 410,
      message: backendMsg ?? 'That invite link has expired.',
    };
  }
  if (status === 403 && scope === 'delete') {
    return {
      status: 403,
      message:
        backendMsg ??
        'Delete is unavailable for this upload in the current policy window.',
    };
  }
  if (
    status === 413 ||
    errorCode === 'REQUEST_TOO_LARGE' ||
    errorCode === 'UPLOAD_FILE_TOO_LARGE'
  ) {
    return {
      status: 413,
      message:
        backendMsg ??
        'This file is too large for upload. Choose a smaller video and retry.',
    };
  }
  if (!Number.isFinite(status)) {
    return {
      status: 0,
      message:
        backendMsg ??
        'Network error. Please check your connection and try again.',
    };
  }
  return null;
}
