import { requestWithMeta } from '@/lib/api/client/request';
import { HttpError } from '@/lib/api/errors/errors';
import { candidateClientOptions } from './base';
import { DRAFT_NOT_FOUND } from './taskDrafts.constants';
import { getTaskDraftErrorCode, mapTaskDraftError } from './taskDrafts.errors';
import { enforcePayloadBounds } from './taskDrafts.payload';
import {
  normalizePayload,
  normalizeTaskDraft,
  normalizeUpsertResponse,
} from './taskDrafts.normalize';
import type {
  CandidateTaskDraft,
  CandidateTaskDraftPayload,
  CandidateTaskDraftUpsertResponse,
} from './taskDrafts.types';
import { normalizeStatus } from './taskErrorMessages';

export async function getCandidateTaskDraft(params: {
  taskId: number;
  candidateSessionId: number;
}): Promise<CandidateTaskDraft | null> {
  const { taskId, candidateSessionId } = params;
  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${taskId}/draft`,
      {
        cache: 'no-store',
        headers: { 'x-candidate-session-id': String(candidateSessionId) },
      },
      candidateClientOptions,
    );
    return normalizeTaskDraft(data, taskId);
  } catch (err) {
    const status = normalizeStatus(err, null);
    if (status === 404 && getTaskDraftErrorCode(err) === DRAFT_NOT_FOUND) {
      return null;
    }
    mapTaskDraftError(err, 'Something went wrong loading your draft.');
  }
}

export async function putCandidateTaskDraft(params: {
  taskId: number;
  candidateSessionId: number;
  payload: CandidateTaskDraftPayload;
}): Promise<CandidateTaskDraftUpsertResponse> {
  const { taskId, candidateSessionId } = params;
  const payload = normalizePayload(params.payload);
  enforcePayloadBounds(payload);

  try {
    const { data } = await requestWithMeta<unknown>(
      `/tasks/${taskId}/draft`,
      {
        method: 'PUT',
        cache: 'no-store',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': String(candidateSessionId),
        },
      },
      candidateClientOptions,
    );

    const normalized = normalizeUpsertResponse(data, taskId);
    if (!normalized) {
      throw new HttpError(502, 'Invalid draft response from server.');
    }
    return normalized;
  } catch (err) {
    mapTaskDraftError(err, 'Something went wrong saving your draft.');
  }
}
