import { toStringOrNull } from '../utils/parsing';
import type { ScenarioEditorDraftPair, ScenarioEditorFieldErrors } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function buildScenarioEditorFieldErrors(
  details: Record<string, unknown> | null | undefined,
  fallbackMessage: string,
): ScenarioEditorFieldErrors {
  const next: ScenarioEditorFieldErrors = {};
  const safeDetails = details ?? null;
  if (!safeDetails) return next;
  const safeMessage =
    toStringOrNull(safeDetails.detail ?? safeDetails.message) ?? fallbackMessage;
  const directField = toStringOrNull(safeDetails.field);
  if (directField === 'storylineMd' || directField === 'taskPrompts' || directField === 'rubric') {
    next[directField] = safeMessage;
  }
  const detailEntries = safeDetails.detail;
  if (!Array.isArray(detailEntries)) return next;
  for (const entry of detailEntries) {
    const record = asRecord(entry);
    if (!record) continue;
    const loc = Array.isArray(record.loc)
      ? record.loc.map((value) => toStringOrNull(value)).filter(Boolean)
      : [];
    const field = loc.find(
      (value): value is 'storylineMd' | 'taskPrompts' | 'rubric' =>
        value === 'storylineMd' || value === 'taskPrompts' || value === 'rubric',
    );
    if (!field || next[field]) continue;
    next[field] =
      toStringOrNull(record.msg ?? record.message ?? record.detail) ?? safeMessage;
  }
  return next;
}

export function areScenarioEditorDraftsEqual({
  left,
  right,
}: ScenarioEditorDraftPair): boolean {
  if (!left) return false;
  return (
    left.isDirty === right.isDirty &&
    left.storylineInput === right.storylineInput &&
    left.taskPromptsInput === right.taskPromptsInput &&
    left.rubricInput === right.rubricInput
  );
}
