import { requestWithMeta } from '@/lib/api/client/request';
import { toMappedHttpError } from '@/lib/api/errors/errorMapping';
import { HttpError } from '@/lib/api/errors/errors';
import { candidateClientOptions, toNumberOrNull } from './base';
import { deriveBackendMessage, normalizeStatus } from './taskErrorMessages';

export type CandidateTaskDraft = {
  taskId: number;
  contentText: string | null;
  contentJson: Record<string, unknown> | null;
  updatedAt: string;
  finalizedAt: string | null;
  finalizedSubmissionId: number | null;
};

export type CandidateTaskDraftPayload = {
  contentText?: string | null;
  contentJson?: Record<string, unknown> | null;
};

export type CandidateTaskDraftUpsertResponse = {
  taskId: number;
  updatedAt: string;
};

export const MAX_DRAFT_CONTENT_BYTES = 200 * 1024;

const DRAFT_NOT_FOUND = 'DRAFT_NOT_FOUND';
const DRAFT_CONTENT_TOO_LARGE = 'DRAFT_CONTENT_TOO_LARGE';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toIsoStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const iso = value.trim();
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return null;
  return iso;
}

function normalizeContentJson(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  return record ? { ...record } : null;
}

function normalizeTaskDraft(
  raw: unknown,
  fallbackTaskId: number,
): CandidateTaskDraft | null {
  const record = asRecord(raw);
  if (!record) return null;
  const taskId = toNumberOrNull(record.taskId) ?? fallbackTaskId;
  const updatedAt = toIsoStringOrNull(record.updatedAt);
  if (!updatedAt) return null;

  return {
    taskId,
    contentText:
      typeof record.contentText === 'string' ? record.contentText : null,
    contentJson: normalizeContentJson(record.contentJson),
    updatedAt,
    finalizedAt: toIsoStringOrNull(record.finalizedAt),
    finalizedSubmissionId: toNumberOrNull(record.finalizedSubmissionId),
  };
}

function normalizeUpsertResponse(
  raw: unknown,
  fallbackTaskId: number,
): CandidateTaskDraftUpsertResponse | null {
  const record = asRecord(raw);
  if (!record) return null;
  const taskId = toNumberOrNull(record.taskId) ?? fallbackTaskId;
  const updatedAt = toIsoStringOrNull(record.updatedAt);
  if (!updatedAt) return null;
  return { taskId, updatedAt };
}

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
  if (sourceDetails !== undefined) {
    (next as { details?: unknown }).details = sourceDetails;
  }
  throw next;
}

function mapTaskDraftError(err: unknown, fallbackMessage: string): never {
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

  if (status === 404 && errorCode !== DRAFT_NOT_FOUND) {
    return copyMapped(sourceDetails, mapped, {
      status: 404,
      message:
        backendMsg ??
        'Task not found in this session. Please refresh and retry.',
    });
  }
  if (status === 409 && errorCode === 'TASK_WINDOW_CLOSED') {
    return copyMapped(sourceDetails, mapped, {
      status: 409,
      message:
        backendMsg ??
        'This task window is closed. Draft autosave is paused until the window opens.',
    });
  }
  if (status === 409 && errorCode === 'DRAFT_FINALIZED') {
    return copyMapped(sourceDetails, mapped, {
      status: 409,
      message:
        backendMsg ?? 'Task draft is finalized and can no longer be edited.',
    });
  }
  if (status === 413 && errorCode === DRAFT_CONTENT_TOO_LARGE) {
    return copyMapped(sourceDetails, mapped, {
      status: 413,
      message:
        backendMsg ??
        `Draft exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes and could not be saved.`,
    });
  }
  if (!Number.isFinite(status)) {
    return copyMapped(sourceDetails, mapped, {
      status: 0,
      message:
        backendMsg ??
        'Network error. Please check your connection and try again.',
    });
  }

  const fallback = backendMsg ?? fallbackMessage;
  throw copyMapped(sourceDetails, mapped, { message: fallback });
}

function utf8ByteSize(value: string | null | undefined): number {
  if (typeof value !== 'string') return 0;
  if (typeof TextEncoder !== 'undefined')
    return new TextEncoder().encode(value).length;
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf-8');
  if (typeof Blob !== 'undefined') return new Blob([value]).size;
  return value.length;
}

function jsonByteSize(
  value: Record<string, unknown> | null | undefined,
): number {
  if (!value) return 0;
  try {
    const encoded = JSON.stringify(value, null, 0);
    return utf8ByteSize(encoded);
  } catch {
    return MAX_DRAFT_CONTENT_BYTES + 1;
  }
}

function buildTooLargeError(
  field: 'contentText' | 'contentJson',
  actualBytes: number,
): HttpError {
  const error = new HttpError(
    413,
    `${field} exceeds ${String(MAX_DRAFT_CONTENT_BYTES)} bytes.`,
  );
  (error as { details?: unknown }).details = {
    errorCode: DRAFT_CONTENT_TOO_LARGE,
    details: {
      field,
      maxBytes: MAX_DRAFT_CONTENT_BYTES,
      actualBytes,
    },
  };
  return error;
}

function enforcePayloadBounds(payload: CandidateTaskDraftPayload) {
  const textBytes = utf8ByteSize(payload.contentText);
  if (textBytes > MAX_DRAFT_CONTENT_BYTES) {
    throw buildTooLargeError('contentText', textBytes);
  }
  const jsonBytes = jsonByteSize(payload.contentJson);
  if (jsonBytes > MAX_DRAFT_CONTENT_BYTES) {
    throw buildTooLargeError('contentJson', jsonBytes);
  }
}

function normalizePayload(
  payload: CandidateTaskDraftPayload,
): CandidateTaskDraftPayload {
  const normalized: CandidateTaskDraftPayload = {};
  if (payload.contentText !== undefined) {
    normalized.contentText =
      typeof payload.contentText === 'string' ? payload.contentText : null;
  }
  if (payload.contentJson !== undefined) {
    normalized.contentJson = payload.contentJson
      ? { ...payload.contentJson }
      : null;
  }
  return normalized;
}

export async function getCandidateTaskDraft(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<CandidateTaskDraft | null> {
  const { taskId, candidateSessionId } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${taskId}/draft`,
      {
        cache: 'no-store',
        headers: { 'x-candidate-session-id': String(candidateSessionId) },
      },
      candidateClientOptions,
    );
    return normalizeTaskDraft(data, taskId);
  } catch (err) {
    const status = normalizeStatus(err, null);
    if (status === 404 && getTaskDraftErrorCode(err) === DRAFT_NOT_FOUND) {
      return null;
    }
    mapTaskDraftError(err, 'Something went wrong loading your draft.');
  }
}

export async function putCandidateTaskDraft(params: {
  taskId: number;
  candidateSessionId: number;
  payload: CandidateTaskDraftPayload;
}): Promise<CandidateTaskDraftUpsertResponse> {
  const { taskId, candidateSessionId } = params;
  const payload = normalizePayload(params.payload);
  enforcePayloadBounds(payload);

  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${taskId}/draft`,
      {
        method: 'PUT',
        cache: 'no-store',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': String(candidateSessionId),
        },
      },
      candidateClientOptions,
    );

    const normalized = normalizeUpsertResponse(data, taskId);
    if (!normalized) {
      throw new HttpError(502, 'Invalid draft response from server.');
    }
    return normalized;
  } catch (err) {
    mapTaskDraftError(err, 'Something went wrong saving your draft.');
  }
}
