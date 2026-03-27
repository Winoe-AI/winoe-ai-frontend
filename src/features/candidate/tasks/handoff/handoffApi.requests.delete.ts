import { requestWithMeta } from '@/platform/api-client/client/request';
import { HttpError } from '@/platform/api-client/errors/errors';
import {
  candidateClientOptions,
  toStringOrNull,
} from '@/features/candidate/session/api/baseApi';
import { mapHandoffApiError } from './handoffApi.errors';
import { normalizeDeleteResponse } from './handoffApi.normalize';
import { candidateJsonHeaders } from './handoffApi.requestHeaders';
import type { HandoffDeleteResponse } from './handoffApi.types';

export async function deleteHandoffUpload(params: {
  taskId: number;
  candidateSessionId: number;
  recordingId?: string | null;
}): Promise<HandoffDeleteResponse> {
  const { candidateSessionId, recordingId } = params;
  const normalizedRecordingId = toStringOrNull(recordingId);
  if (!normalizedRecordingId) {
    throw new HttpError(404, 'Upload not found. Refresh and retry.');
  }
  try {
    const { data } = await requestWithMeta<unknown>(
      `/recordings/${encodeURIComponent(normalizedRecordingId)}/delete`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: candidateJsonHeaders(candidateSessionId),
      },
      candidateClientOptions,
    );
    return normalizeDeleteResponse(data);
  } catch (err) {
    mapHandoffApiError(err, 'delete');
  }
}
