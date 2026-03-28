import type { TaskWindowClosedOverride } from './windowState.types';
import { asRecord, readCode, toIsoOrNull } from './windowState.parse';

export function extractTaskWindowClosedOverride(
  err: unknown,
): TaskWindowClosedOverride | null {
  const record = asRecord(err);
  const details = asRecord(record?.details);
  const raw = asRecord(record?.raw);
  const rawDetails = asRecord(raw?.details);
  const carrier = details ?? rawDetails ?? record;
  const nestedDetails = asRecord(carrier?.details);
  const code =
    readCode(carrier) ??
    readCode(record) ??
    readCode(rawDetails) ??
    readCode(nestedDetails);
  if (code !== 'TASK_WINDOW_CLOSED') return null;

  const payload = nestedDetails ?? carrier;
  let detailMessage: string | null = null;
  if (typeof carrier?.detail === 'string' && carrier.detail.trim()) {
    detailMessage = carrier.detail.trim();
  } else if (typeof carrier?.message === 'string' && carrier.message.trim()) {
    detailMessage = carrier.message.trim();
  } else if (typeof record?.message === 'string' && record.message.trim()) {
    detailMessage = record.message.trim();
  }

  return {
    errorCode: 'TASK_WINDOW_CLOSED',
    windowStartAt: toIsoOrNull(payload?.windowStartAt),
    windowEndAt: toIsoOrNull(payload?.windowEndAt),
    nextOpenAt: toIsoOrNull(payload?.nextOpenAt),
    detail: detailMessage,
    receivedAtMs: Date.now(),
  };
}
