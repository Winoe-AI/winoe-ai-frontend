import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/candidate/session/api/baseApi';
import { asRecord } from './handoffApi.normalize.shared';
import type {
  HandoffUploadCompleteResponse,
  HandoffUploadInitResponse,
} from './handoffApi.types';

export function normalizeInitResponse(
  raw: unknown,
): HandoffUploadInitResponse | null {
  const record = asRecord(raw);
  if (!record) return null;
  const recordingId = toStringOrNull(record.recordingId ?? record.recording_id);
  const uploadUrl = toStringOrNull(record.uploadUrl ?? record.upload_url);
  if (!recordingId || !uploadUrl) return null;

  const expiresInSeconds =
    toNumberOrNull(record.expiresInSeconds ?? record.expires_in_seconds) ?? 900;
  return {
    recordingId,
    uploadUrl,
    expiresInSeconds,
  };
}

export function normalizeCompleteResponse(
  raw: unknown,
): HandoffUploadCompleteResponse | null {
  const record = asRecord(raw);
  if (!record) return null;
  const recordingId = toStringOrNull(record.recordingId ?? record.recording_id);
  const status = toStringOrNull(record.status);
  if (!recordingId || !status) return null;
  return { recordingId, status };
}
