import { toStringOrNull } from '@/features/candidate/api/base';
import { asRecord, toBooleanOrNull, toIsoOrNull } from './handoffApi.normalize.shared';
import type { HandoffDeleteResponse } from './handoffApi.types';

export function normalizeDeleteResponse(raw: unknown): HandoffDeleteResponse {
  const record = asRecord(raw);
  return {
    deleted:
      toBooleanOrNull(
        record?.deleted ?? record?.isDeleted ?? record?.is_deleted ?? record?.ok,
      ) ?? true,
    deletedAt:
      toIsoOrNull(record?.deletedAt ?? record?.deleted_at ?? record?.at) ?? null,
    status: toStringOrNull(record?.status) ?? null,
  };
}
