import type { ApiClientOptions } from '@/lib/api/client';
import { throwMappedApiError } from '@/lib/api/errors/errorMapping';

export const candidateClientOptions: ApiClientOptions = {
  basePath: '/api/backend',
  skipAuth: false,
};

export function mapCandidateApiError(error: unknown, fallback: string): never {
  throwMappedApiError(error, fallback, 'candidate');
}

export const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

export const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const toDateString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

export const toIdString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

export function toCandidateSessionId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
}
