import type { SubmitResponse, Task } from '../types';

export type CodingShaRefs = {
  checkpointSha: string | null;
  finalSha: string | null;
  commitSha: string | null;
};

export type DurableCodingSubmission = {
  taskId: number;
  progress: { completed: number; total: number } | null;
  shaRefs: CodingShaRefs;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toCodingShaRefs(response: SubmitResponse): CodingShaRefs {
  return {
    checkpointSha: toNullableString(response.checkpointSha),
    finalSha: toNullableString(response.finalSha),
    commitSha: toNullableString(response.commitSha),
  };
}

export function pickTextFromStructuredJson(value: unknown): string | null {
  const root = asRecord(value);
  if (!root) return null;
  const directKeys = ['reflectionMarkdown', 'markdown', 'reflection', 'content'];
  for (const key of directKeys) {
    const candidate = root[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  const sections = asRecord(root.sections);
  if (!sections) return null;
  const chunks = Object.values(sections)
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return chunks.length > 0 ? chunks.join('\n\n') : null;
}

export function resolveFinalizedText(task: Task): {
  text: string;
  available: boolean;
} {
  const recorded = task.recordedSubmission;
  if (!recorded) return { text: '', available: false };
  if (typeof recorded.contentText === 'string' && recorded.contentText.length > 0) {
    return { text: recorded.contentText, available: true };
  }
  const structured = pickTextFromStructuredJson(recorded.contentJson);
  if (structured !== null) return { text: structured, available: true };
  return { text: '', available: false };
}
