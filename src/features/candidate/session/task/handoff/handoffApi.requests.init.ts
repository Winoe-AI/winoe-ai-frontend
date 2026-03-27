import { requestWithMeta } from '@/lib/api/client/request';
import { HttpError } from '@/lib/api/errors/errors';
import { candidateClientOptions } from '@/features/candidate/api/base';
import { mapHandoffApiError } from './handoffApi.errors';
import { normalizeInitResponse } from './handoffApi.normalize';
import { candidateJsonHeaders } from './handoffApi.requestHeaders';
import type { HandoffUploadInitResponse } from './handoffApi.types';

export async function initHandoffUpload(params: {
  taskId: number;
  candidateSessionId: number;
  contentType: string;
  sizeBytes: number;
  filename?: string | null;
}): Promise<HandoffUploadInitResponse> {
  const { taskId, candidateSessionId, contentType, sizeBytes, filename } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/upload/init`,
      {
        method: 'POST',
        cache: 'no-store',
        body: { contentType, sizeBytes, filename: filename ?? undefined },
        headers: candidateJsonHeaders(candidateSessionId),
      },
      candidateClientOptions,
    );
    const normalized = normalizeInitResponse(data);
    if (!normalized) throw new HttpError(502, 'Invalid upload initialization response.');
    return normalized;
  } catch (err) {
    mapHandoffApiError(err, 'init');
  }
}
