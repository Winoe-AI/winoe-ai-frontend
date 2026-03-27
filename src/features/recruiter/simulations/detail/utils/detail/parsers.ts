import { toNumberOrNull, toStringOrNull } from '../parsing';
import type { ScenarioContentAvailability, SimulationLifecycleStatus } from './types';

const LIFECYCLE_STATUS: ReadonlyArray<SimulationLifecycleStatus> = [
  'draft',
  'generating',
  'ready_for_review',
  'active_inviting',
  'terminated',
];

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function toNonEmptyString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return toStringOrNull(value);
}

export function parseLifecycleStatus(
  value: unknown,
): SimulationLifecycleStatus | null {
  const status = toStringOrNull(value)?.toLowerCase() ?? null;
  if (!status) return null;
  if (LIFECYCLE_STATUS.includes(status as SimulationLifecycleStatus)) {
    return status as SimulationLifecycleStatus;
  }
  return null;
}

export function parseVersionIndex(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed && parsed >= 1) return Math.floor(parsed);
  const str = toStringOrNull(value);
  if (!str) return null;
  const match = str.match(/(\d+)/);
  if (!match) return null;
  const maybe = Number(match[1]);
  if (!Number.isFinite(maybe) || maybe < 1) return null;
  return Math.floor(maybe);
}

export function parseContentAvailability(
  value: unknown,
): ScenarioContentAvailability | null {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? null;
  if (normalized === 'canonical') return normalized;
  if (normalized === 'local_only') return normalized;
  if (normalized === 'unavailable') return normalized;
  return null;
}

export function hasCanonicalScenarioContent(
  record: Record<string, unknown> | null,
): boolean {
  if (!record) return false;
  return (
    Object.prototype.hasOwnProperty.call(record, 'storylineMd') ||
    Object.prototype.hasOwnProperty.call(record, 'storyline_md') ||
    Object.prototype.hasOwnProperty.call(record, 'storyline') ||
    Object.prototype.hasOwnProperty.call(record, 'taskPromptsJson') ||
    Object.prototype.hasOwnProperty.call(record, 'task_prompts_json') ||
    Object.prototype.hasOwnProperty.call(record, 'taskPrompts') ||
    Object.prototype.hasOwnProperty.call(record, 'rubricJson') ||
    Object.prototype.hasOwnProperty.call(record, 'rubric_json') ||
    Object.prototype.hasOwnProperty.call(record, 'rubric')
  );
}

export function isFailureStatus(value: string | null | undefined): boolean {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? '';
  if (!normalized) return false;
  return (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('dead_letter') ||
    normalized.includes('cancel')
  );
}

export function isGeneratingStatus(value: string | null | undefined): boolean {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? '';
  return (
    normalized === 'generating' ||
    normalized === 'queued' ||
    normalized === 'running'
  );
}
