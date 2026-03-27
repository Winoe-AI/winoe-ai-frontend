import type { HandoffSubmissionArtifact } from '../types';
import {
  asRecord,
  toIsoOrNull,
  toNullableBoolean,
  toNullableString,
} from './candidateSubmissionsApi.primitivesUtils';
import { normalizeTranscript } from './candidateSubmissionsApi.transcriptUtils';

export function normalizeHandoff(
  record: Record<string, unknown>,
): HandoffSubmissionArtifact | null {
  const handoffRecord = asRecord(record.handoff);
  if (!handoffRecord) return null;

  const recordingId =
    toNullableString(handoffRecord.recordingId ?? handoffRecord.recording_id) ??
    null;
  const downloadUrl =
    toNullableString(handoffRecord.downloadUrl ?? handoffRecord.download_url) ??
    null;
  const recordingStatus =
    toNullableString(
      handoffRecord.recordingStatus ?? handoffRecord.recording_status,
    ) ?? null;
  const isDeleted =
    toNullableBoolean(
      handoffRecord.isDeleted ??
        handoffRecord.is_deleted ??
        handoffRecord.deleted,
    ) ?? null;
  const deletedAt =
    toIsoOrNull(handoffRecord.deletedAt ?? handoffRecord.deleted_at) ?? null;
  const transcript = normalizeTranscript(handoffRecord);

  if (
    !recordingId &&
    !downloadUrl &&
    !transcript &&
    !recordingStatus &&
    !isDeleted &&
    !deletedAt
  ) {
    return null;
  }
  return {
    recordingId,
    downloadUrl,
    recordingStatus,
    isDeleted,
    deletedAt,
    transcript,
  };
}
