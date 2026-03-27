import { toStringOrNull } from '@/features/candidate/session/api/baseApi';
import { normalizeTranscriptSegments } from './handoffApi.normalize.transcript';
import {
  normalizeProgressPct,
  toBooleanOrNull,
  toIsoOrNull,
} from './handoffApi.normalize.shared';
import {
  resolveDeleteFields,
  resolveStatusRecords,
} from './handoffApi.normalize.statusFields';
import type { HandoffStatusResponse } from './handoffApi.types';

export function normalizeStatusResponse(raw: unknown): HandoffStatusResponse {
  const {
    record,
    recordingRecord,
    transcriptRecord,
    consentRecord,
    noticeRecord,
  } = resolveStatusRecords(raw);
  const deleteFields = resolveDeleteFields(record, recordingRecord);
  const transcriptStatus =
    toStringOrNull(transcriptRecord?.status ?? transcriptRecord?.state) ??
    deleteFields.transcriptStatus;

  return {
    recordingId:
      toStringOrNull(
        recordingRecord?.recordingId ??
          recordingRecord?.recording_id ??
          record?.recordingId ??
          record?.recording_id,
      ) ?? null,
    recordingStatus: deleteFields.recordingStatus,
    recordingDownloadUrl:
      toStringOrNull(
        recordingRecord?.downloadUrl ??
          recordingRecord?.download_url ??
          record?.recordingDownloadUrl ??
          record?.recording_download_url,
      ) ?? null,
    transcriptStatus,
    transcriptProgressPct: normalizeProgressPct(
      transcriptRecord?.progress ??
        transcriptRecord?.progressPct ??
        transcriptRecord?.progress_pct,
    ),
    transcriptText:
      toStringOrNull(
        transcriptRecord?.text ??
          record?.transcriptText ??
          record?.transcript_text,
      ) ?? null,
    transcriptSegments: normalizeTranscriptSegments(
      transcriptRecord?.segments ??
        record?.transcriptSegments ??
        record?.transcript_segments,
    ),
    consentStatus:
      toBooleanOrNull(
        consentRecord?.accepted ??
          consentRecord?.consented ??
          record?.consentStatus ??
          record?.consent_status ??
          record?.consented ??
          record?.consentAccepted ??
          record?.consent_accepted,
      ) ?? null,
    consentedAt:
      toIsoOrNull(
        consentRecord?.consentedAt ??
          consentRecord?.acceptedAt ??
          record?.consentedAt ??
          record?.consented_at,
      ) ?? null,
    isDeleted: deleteFields.isDeleted,
    deletedAt: deleteFields.deletedAt,
    canDelete: toBooleanOrNull(record?.canDelete ?? record?.can_delete) ?? null,
    deleteDisabledReason:
      toStringOrNull(
        record?.deleteDisabledReason ?? record?.delete_disabled_reason,
      ) ?? null,
    aiNoticeVersion:
      toStringOrNull(
        noticeRecord?.version ??
          record?.aiNoticeVersion ??
          record?.ai_notice_version ??
          record?.noticeVersion ??
          record?.notice_version,
      ) ?? null,
    aiNoticeEnabled:
      toBooleanOrNull(
        noticeRecord?.enabled ??
          record?.aiNoticeEnabled ??
          record?.ai_notice_enabled,
      ) ?? null,
    aiNoticeSummaryUrl:
      toStringOrNull(
        noticeRecord?.summaryUrl ??
          noticeRecord?.summary_url ??
          record?.aiNoticeSummaryUrl ??
          record?.ai_notice_summary_url ??
          record?.noticeSummaryUrl ??
          record?.notice_summary_url,
      ) ?? null,
  };
}
