import { requestWithMeta } from '@/lib/api/client/request';
import { toMappedHttpError } from '@/lib/api/errors/errorMapping';
import { HttpError } from '@/lib/api/errors/errors';
import {
  candidateClientOptions,
  toIdString,
  toNumberOrNull,
  toStringOrNull,
} from '@/features/candidate/api/base';
import {
  deriveBackendMessage,
  normalizeStatus,
} from '@/features/candidate/api/taskErrorMessages';

export type HandoffUploadInitResponse = {
  recordingId: string;
  uploadUrl: string;
  expiresInSeconds: number;
};

export type HandoffUploadCompleteResponse = {
  recordingId: string;
  status: string;
};

export type HandoffStatusResponse = {
  recordingId: string | null;
  recordingStatus: string | null;
  recordingDownloadUrl: string | null;
  transcriptStatus: string;
  transcriptProgressPct: number | null;
  transcriptText: string | null;
  transcriptSegments: HandoffTranscriptSegment[] | null;
};

export type HandoffTranscriptSegment = {
  id: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

type RequestScope = 'init' | 'complete' | 'status';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readErrorCode(record: Record<string, unknown> | null): string | null {
  if (!record) return null;
  const codeValue = record.errorCode ?? record.code;
  return toStringOrNull(codeValue);
}

function getHandoffErrorCode(err: unknown): string | null {
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

function scopeFallback(scope: RequestScope): string {
  if (scope === 'init') return 'Unable to start upload right now.';
  if (scope === 'complete') return 'Unable to finalize upload right now.';
  return 'Unable to load handoff status right now.';
}

function mapHandoffApiError(err: unknown, scope: RequestScope): never {
  if (err instanceof TypeError) {
    throw new HttpError(
      0,
      'Network error. Please check your connection and try again.',
      (err as { headers?: Headers }).headers,
    );
  }

  const fallback = scopeFallback(scope);
  const backendMsg = deriveBackendMessage(err);
  const mapped = toMappedHttpError(err, fallback, 'candidate');
  const status = normalizeStatus(err, mapped.status);
  const sourceDetails =
    err && typeof err === 'object'
      ? (err as { details?: unknown }).details
      : undefined;
  const errorCode = getHandoffErrorCode(err);

  if (status === 404) {
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
        'This day is currently closed. Video uploads are locked until the window reopens.',
    });
  }
  if (status === 410) {
    return copyMapped(sourceDetails, mapped, {
      status: 410,
      message: backendMsg ?? 'That invite link has expired.',
    });
  }
  if (
    status === 413 ||
    errorCode === 'REQUEST_TOO_LARGE' ||
    errorCode === 'UPLOAD_FILE_TOO_LARGE'
  ) {
    return copyMapped(sourceDetails, mapped, {
      status: 413,
      message:
        backendMsg ??
        'This file is too large for upload. Choose a smaller video and retry.',
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

  throw copyMapped(sourceDetails, mapped, {
    message: backendMsg ?? fallback,
  });
}

function normalizeInitResponse(raw: unknown): HandoffUploadInitResponse | null {
  const record = asRecord(raw);
  if (!record) return null;
  const recordingId = toStringOrNull(record.recordingId ?? record.recording_id);
  const uploadUrl = toStringOrNull(record.uploadUrl ?? record.upload_url);
  if (!recordingId || !uploadUrl) return null;

  const expiresInSeconds =
    toNumberOrNull(record.expiresInSeconds ?? record.expires_in_seconds) ?? 900;
  return {
    recordingId,
    uploadUrl,
    expiresInSeconds,
  };
}

function normalizeCompleteResponse(
  raw: unknown,
): HandoffUploadCompleteResponse | null {
  const record = asRecord(raw);
  if (!record) return null;
  const recordingId = toStringOrNull(record.recordingId ?? record.recording_id);
  const status = toStringOrNull(record.status);
  if (!recordingId || !status) return null;
  return { recordingId, status };
}

function normalizeProgressPct(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeTranscriptSegment(
  raw: unknown,
): HandoffTranscriptSegment | null {
  const record = asRecord(raw);
  if (!record) return null;

  const startMs = toNumberOrNull(record.startMs ?? record.start_ms);
  const endMs = toNumberOrNull(record.endMs ?? record.end_ms);
  const text = toStringOrNull(record.text);
  if (startMs === null || endMs === null || text === null) return null;

  const roundedStartMs = Math.max(0, Math.round(startMs));
  const roundedEndMs = Math.max(roundedStartMs, Math.round(endMs));

  return {
    id: toIdString(record.id),
    startMs: roundedStartMs,
    endMs: roundedEndMs,
    text,
  };
}

function normalizeTranscriptSegments(
  value: unknown,
): HandoffTranscriptSegment[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map(normalizeTranscriptSegment)
    .filter((segment): segment is HandoffTranscriptSegment => Boolean(segment));
}

function normalizeStatusResponse(raw: unknown): HandoffStatusResponse {
  const record = asRecord(raw);
  const recordingRecord = asRecord(record?.recording);
  const transcriptRecord = asRecord(record?.transcript);

  return {
    recordingId:
      toStringOrNull(
        recordingRecord?.recordingId ??
          recordingRecord?.recording_id ??
          record?.recordingId ??
          record?.recording_id,
      ) ?? null,
    recordingStatus:
      toStringOrNull(
        recordingRecord?.status ??
          record?.recordingStatus ??
          record?.recording_status,
      ) ?? null,
    recordingDownloadUrl:
      toStringOrNull(
        recordingRecord?.downloadUrl ??
          recordingRecord?.download_url ??
          record?.recordingDownloadUrl ??
          record?.recording_download_url,
      ) ?? null,
    transcriptStatus:
      toStringOrNull(transcriptRecord?.status ?? transcriptRecord?.state) ??
      'not_started',
    transcriptProgressPct: normalizeProgressPct(
      transcriptRecord?.progress ??
        transcriptRecord?.progressPct ??
        transcriptRecord?.progress_pct,
    ),
    transcriptText:
      toStringOrNull(
        transcriptRecord?.text ??
          record?.transcriptText ??
          record?.transcript_text,
      ) ?? null,
    transcriptSegments: normalizeTranscriptSegments(
      transcriptRecord?.segments ??
        record?.transcriptSegments ??
        record?.transcript_segments,
    ),
  };
}

export async function initHandoffUpload(params: {
  taskId: number;
  candidateSessionId: number;
  contentType: string;
  sizeBytes: number;
  filename?: string | null;
}): Promise<HandoffUploadInitResponse> {
  const { taskId, candidateSessionId, contentType, sizeBytes, filename } =
    params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/upload/init`,
      {
        method: 'POST',
        cache: 'no-store',
        body: {
          contentType,
          sizeBytes,
          filename: filename ?? undefined,
        },
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': String(candidateSessionId),
        },
      },
      candidateClientOptions,
    );

    const normalized = normalizeInitResponse(data);
    if (!normalized) {
      throw new HttpError(502, 'Invalid upload initialization response.');
    }
    return normalized;
  } catch (err) {
    mapHandoffApiError(err, 'init');
  }
}

export async function completeHandoffUpload(params: {
  taskId: number;
  candidateSessionId: number;
  recordingId: string;
}): Promise<HandoffUploadCompleteResponse> {
  const { taskId, candidateSessionId, recordingId } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/upload/complete`,
      {
        method: 'POST',
        cache: 'no-store',
        body: { recordingId },
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': String(candidateSessionId),
        },
      },
      candidateClientOptions,
    );
    const normalized = normalizeCompleteResponse(data);
    if (!normalized) {
      throw new HttpError(502, 'Invalid upload completion response.');
    }
    return normalized;
  } catch (err) {
    mapHandoffApiError(err, 'complete');
  }
}

export async function getHandoffStatus(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<HandoffStatusResponse> {
  const { taskId, candidateSessionId } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/status`,
      {
        cache: 'no-store',
        headers: {
          'x-candidate-session-id': String(candidateSessionId),
        },
      },
      candidateClientOptions,
    );
    return normalizeStatusResponse(data);
  } catch (err) {
    mapHandoffApiError(err, 'status');
  }
}

export async function uploadFileToSignedUrl(params: {
  uploadUrl: string;
  uploadMethod?: 'PUT' | 'POST';
  file: File;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { uploadUrl, file, signal, onProgress, uploadMethod = 'PUT' } = params;
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    throw new HttpError(400, 'Upload URL is missing.');
  }
  if (!file) {
    throw new HttpError(400, 'Upload file is missing.');
  }
  if (signal?.aborted) {
    throw new HttpError(0, 'Upload was cancelled.');
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanups: Array<() => void> = [];
    const finish = (fn: () => void) => {
      while (cleanups.length > 0) {
        const cleanup = cleanups.pop();
        if (cleanup) cleanup();
      }
      fn();
    };

    const rejectWithHttpError = (status: number, message: string) => {
      finish(() => reject(new HttpError(status, message)));
    };

    const abortListener = () => xhr.abort();
    if (signal) {
      signal.addEventListener('abort', abortListener, { once: true });
      cleanups.push(() => signal.removeEventListener('abort', abortListener));
    }

    xhr.open(uploadMethod, uploadUrl, true);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      if (!event.total || event.total <= 0) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.max(0, Math.min(100, percent)));
    };

    xhr.onerror = () => {
      rejectWithHttpError(
        0,
        'Video upload failed. Check your connection and try again.',
      );
    };

    xhr.onabort = () => {
      rejectWithHttpError(0, 'Video upload was cancelled.');
    };

    xhr.onload = () => {
      const status = xhr.status;
      if (status >= 200 && status < 300) {
        finish(() => {
          onProgress?.(100);
          resolve();
        });
        return;
      }
      rejectWithHttpError(status || 0, 'Video upload failed. Please retry.');
    };

    xhr.send(file);
  });
}
