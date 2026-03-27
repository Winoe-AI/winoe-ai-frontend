import { toStringOrNull } from '@/features/candidate/api/base';
import {
  asRecord,
  isDeletedRecordingStatus,
  toBooleanOrNull,
  toIsoOrNull,
} from './handoffApi.normalize.shared';

export function resolveStatusRecords(raw: unknown) {
  const rootRecord = asRecord(raw);
  const handoffRecord = asRecord(rootRecord?.handoff);
  const record = handoffRecord ?? rootRecord;
  return {
    record,
    recordingRecord: asRecord(record?.recording),
    transcriptRecord: asRecord(record?.transcript),
    consentRecord: asRecord(record?.consent),
    noticeRecord: asRecord(record?.aiNotice ?? record?.notice),
  };
}

export function resolveDeleteFields(
  record: Record<string, unknown> | null,
  recordingRecord: Record<string, unknown> | null,
) {
  const deletedAt =
    toIsoOrNull(record?.deletedAt) ??
    toIsoOrNull(record?.deleted_at) ??
    toIsoOrNull(record?.handoffDeletedAt) ??
    toIsoOrNull(record?.handoff_deleted_at);
  const explicitDeleteFlag =
    toBooleanOrNull(
      record?.isDeleted ??
        record?.is_deleted ??
        record?.deleted ??
        record?.handoffDeleted ??
        record?.handoff_deleted,
    ) ?? null;
  const recordingStatus =
    toStringOrNull(
      recordingRecord?.status ?? record?.recordingStatus ?? record?.recording_status,
    ) ?? null;
  const isDeleted =
    explicitDeleteFlag ??
    (Boolean(deletedAt) || isDeletedRecordingStatus(recordingStatus));
  const transcriptStatus = isDeleted ? 'deleted' : 'not_started';

  return {
    deletedAt,
    recordingStatus,
    isDeleted,
    transcriptStatus,
  };
}
