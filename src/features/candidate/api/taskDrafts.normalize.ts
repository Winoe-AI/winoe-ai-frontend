import { toNumberOrNull } from './base';
import type {
  CandidateTaskDraft,
  CandidateTaskDraftPayload,
  CandidateTaskDraftUpsertResponse,
} from './taskDrafts.types';

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toIsoStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const iso = value.trim();
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

function normalizeContentJson(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  return record ? { ...record } : null;
}

export function normalizeTaskDraft(
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
    contentText: typeof record.contentText === 'string' ? record.contentText : null,
    contentJson: normalizeContentJson(record.contentJson),
    updatedAt,
    finalizedAt: toIsoStringOrNull(record.finalizedAt),
    finalizedSubmissionId: toNumberOrNull(record.finalizedSubmissionId),
  };
}

export function normalizeUpsertResponse(
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

export function normalizePayload(
  payload: CandidateTaskDraftPayload,
): CandidateTaskDraftPayload {
  const normalized: CandidateTaskDraftPayload = {};
  if (payload.contentText !== undefined) {
    normalized.contentText =
      typeof payload.contentText === 'string' ? payload.contentText : null;
  }
  if (payload.contentJson !== undefined) {
    normalized.contentJson = payload.contentJson ? { ...payload.contentJson } : null;
  }
  return normalized;
}
