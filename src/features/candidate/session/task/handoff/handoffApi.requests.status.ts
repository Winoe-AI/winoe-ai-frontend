import { requestWithMeta } from '@/lib/api/client/request';
import { candidateClientOptions } from '@/features/candidate/api/base';
import { mapHandoffApiError } from './handoffApi.errors';
import { normalizeStatusResponse } from './handoffApi.normalize';
import { candidateSessionHeaders } from './handoffApi.requestHeaders';
import type { HandoffStatusResponse } from './handoffApi.types';

export async function getHandoffStatus(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<HandoffStatusResponse> {
  const { taskId, candidateSessionId } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${String(taskId)}/handoff/status`,
      {
        cache: 'no-store',
        headers: candidateSessionHeaders(candidateSessionId),
      },
      candidateClientOptions,
    );
    return normalizeStatusResponse(data);
  } catch (err) {
    mapHandoffApiError(err, 'status');
  }
}
