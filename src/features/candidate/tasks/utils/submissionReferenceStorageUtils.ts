import { BRAND_SLUG } from '@/platform/config/brand';

export type RecordedSubmissionReference = {
  submissionId: number;
  submittedAt: string;
};

function storageKey(candidateSessionId: number, taskId: number): string {
  return `${BRAND_SLUG}:candidate:recordedSubmission:${String(candidateSessionId)}:${String(taskId)}`;
}

function latestStorageKey(candidateSessionId: number): string {
  return `${BRAND_SLUG}:candidate:recordedSubmissionLatest:${String(candidateSessionId)}`;
}

function normalizeReference(
  value: unknown,
): RecordedSubmissionReference | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const submissionId = record.submissionId;
  const submittedAt = record.submittedAt;
  if (typeof submissionId !== 'number') return null;
  if (typeof submittedAt !== 'string' || !submittedAt.trim()) return null;
  const ts = Date.parse(submittedAt);
  if (!Number.isFinite(ts)) return null;
  return { submissionId, submittedAt };
}

export function loadRecordedSubmissionReference(
  candidateSessionId: number,
  taskId: number,
): RecordedSubmissionReference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(
      storageKey(candidateSessionId, taskId),
    );
    if (!raw) return null;
    return normalizeReference(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveRecordedSubmissionReference(
  candidateSessionId: number,
  taskId: number,
  value: RecordedSubmissionReference,
): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeReference(value);
  if (!normalized) return;
  try {
    window.localStorage.setItem(
      storageKey(candidateSessionId, taskId),
      JSON.stringify(normalized),
    );
    window.localStorage.setItem(
      latestStorageKey(candidateSessionId),
      JSON.stringify(normalized),
    );
  } catch {}
}

export function loadLatestRecordedSubmissionReference(
  candidateSessionId: number,
): RecordedSubmissionReference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(
      latestStorageKey(candidateSessionId),
    );
    if (!raw) return null;
    return normalizeReference(JSON.parse(raw));
  } catch {
    return null;
  }
}
