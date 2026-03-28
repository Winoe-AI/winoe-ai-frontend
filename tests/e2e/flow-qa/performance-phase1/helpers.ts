import type { StorageRole } from './types';
import { storageStates } from '../fixtures/storageStates';

export function toInt(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function toFixed(
  value: number | null | undefined,
  digits: number,
): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

export function storagePath(role: StorageRole): string | undefined {
  if (role === 'recruiter') return storageStates.recruiterOnly;
  if (role === 'candidate') return storageStates.candidateOnly;
  if (role === 'authenticated') return storageStates.authenticated;
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function modeOf<T extends string>(values: T[]): T {
  if (!values.length) return 'none' as T;
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let winner = values[0];
  let winnerCount = -1;
  for (const [value, count] of counts.entries())
    if (count > winnerCount) [winner, winnerCount] = [value, count];
  return winner;
}

export async function waitForAnyVisible(checks: Array<() => Promise<void>>) {
  const reasons: string[] = [];
  try {
    await Promise.any(
      checks.map((check) =>
        check().catch((error) => {
          reasons.push(getErrorMessage(error));
          throw error;
        }),
      ),
    );
  } catch {
    throw new Error(
      `No expected ready state became visible: ${reasons.join(' | ')}`,
    );
  }
}
