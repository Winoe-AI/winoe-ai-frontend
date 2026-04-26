import { resolveNowMs } from '@/shared/time/now';

export function isPastTaskCutoff(cutoffAt?: string | null): boolean {
  if (!cutoffAt) return false;
  const cutoffMs = Date.parse(cutoffAt);
  if (!Number.isFinite(cutoffMs)) return false;
  return resolveNowMs() >= cutoffMs;
}
