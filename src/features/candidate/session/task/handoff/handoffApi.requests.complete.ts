import { requestWithMeta } from '@/lib/api/client/request';
import { HttpError } from '@/lib/api/errors/errors';
import { candidateClientOptions } from '@/features/candidate/api/base';
import { mapHandoffApiError } from './handoffApi.errors';
import { normalizeCompleteResponse } from './handoffApi.normalize';
import { candidateJsonHeaders } from './handoffApi.requestHeaders';
import { buildCompleteBody, persistPrivacyConsent } from './handoffApi.requests.completeConsent';
import type {
  HandoffConsentPayload,
  HandoffUploadCompleteResponse,
} from './handoffApi.types';

export async function completeHandoffUpload(params: {
  taskId: number;
  candidateSessionId: number;
  recordingId: string;
  consent?: HandoffConsentPayload | null;
}): Promise<HandoffUploadCompleteResponse> {
  const { taskId, candidateSessionId, recordingId, consent } = params;
  try {
    const consentState = await persistPrivacyConsent({ candidateSessionId, consent });
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/upload/complete`,
      {
        method: 'POST',
        cache: 'no-store',
        body: buildCompleteBody({ recordingId, ...consentState }),
        headers: candidateJsonHeaders(candidateSessionId),
      },
      candidateClientOptions,
    );
    const normalized = normalizeCompleteResponse(data);
    if (!normalized) throw new HttpError(502, 'Invalid upload completion response.');
    return normalized;
  } catch (err) {
    mapHandoffApiError(err, 'complete');
  }
}
