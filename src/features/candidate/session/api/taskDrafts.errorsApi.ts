import { toMappedHttpError } from '@/platform/api-client/errors/errorMapping';
import { HttpError } from '@/platform/api-client/errors/errors';
import { deriveBackendMessage, normalizeStatus } from './taskErrorMessagesApi';
import {
  DRAFT_CONTENT_TOO_LARGE,
  DRAFT_NOT_FOUND,
  MAX_DRAFT_CONTENT_BYTES,
} from './taskDrafts.constantsApi';
import { asRecord } from './taskDrafts.normalizeApi';

function readErrorCode(record: Record<string, unknown> | null): string | null {
  if (!record) return null;
  const errorCode = record.errorCode;
  if (typeof errorCode === 'string' && errorCode.trim())
    return errorCode.trim();
  const code = record.code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  return null;
}

export function getTaskDraftErrorCode(err: unknown): string | null {
  const root = asRecord(err);
  const details = asRecord(root?.details);
  const raw = asRecord(root?.raw);
  const rawDetails = asRecord(raw?.details);
  const nested = asRecord(details?.details);
  return (
    readErrorCode(details) ??
    readErrorCode(nested) ??
    readErrorCode(rawDetails) ??
    readErrorCode(root)
  );
}

function copyMapped(
  sourceDetails: unknown,
  mapped: HttpError,
  overrides?: { status?: number; message?: string },
): never {
  const next = new HttpError(
    overrides?.status ?? mapped.status,
    overrides?.message ?? mapped.message,
    mapped.headers,
  );
  (next as { redirect?: (() => void) | undefined }).redirect = (
    mapped as { redirect?: (() => void) | undefined }
  ).redirect;
  (next as { raw?: unknown }).raw = (mapped as { raw?: unknown }).raw;
  (next as { meta?: unknown }).meta = (mapped as { meta?: unknown }).meta;
  if (sourceDetails !== undefined)
    (next as { details?: unknown }).details = sourceDetails;
  throw next;
}

export function mapTaskDraftError(
  err: unknown,
  fallbackMessage: string,
): never {
  if (err instanceof TypeError) {
    throw new HttpError(
      0,
      'Network error. Please check your connection and try again.',
      (err as { headers?: Headers }).headers,
    );
  }

  const backendMsg = deriveBackendMessage(err);
  const mapped = toMappedHttpError(err, fallbackMessage, 'candidate');
  const status = normalizeStatus(err, mapped.status);
  const sourceDetails =
    err && typeof err === 'object'
      ? (err as { details?: unknown }).details
      : undefined;
  const errorCode = getTaskDraftErrorCode(err);

  if (status === 404 && errorCode !== DRAFT_NOT_FOUND)
    return copyMapped(sourceDetails, mapped, {
      status: 404,
      message:
        backendMsg ??
        'Task not found in this session. Please refresh and retry.',
    });
  if (status === 409 && errorCode === 'TASK_WINDOW_CLOSED')
    return copyMapped(sourceDetails, mapped, {
      status: 409,
      message:
        backendMsg ??
        'This task window is closed. Draft autosave is paused until the window opens.',
    });
  if (status === 409 && errorCode === 'DRAFT_FINALIZED')
    return copyMapped(sourceDetails, mapped, {
      status: 409,
      message:
        backendMsg ?? 'Task draft is finalized and can no longer be edited.',
    });
  if (status === 413 && errorCode === DRAFT_CONTENT_TOO_LARGE)
    return copyMapped(sourceDetails, mapped, {
      status: 413,
      message:
        backendMsg ??
        `Draft exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes and could not be saved.`,
    });
  if (!Number.isFinite(status))
    return copyMapped(sourceDetails, mapped, {
      status: 0,
      message:
        backendMsg ??
        'Network error. Please check your connection and try again.',
    });

  throw copyMapped(sourceDetails, mapped, {
    message: backendMsg ?? fallbackMessage,
  });
}
