import { requestWithMeta } from '@/platform/api-client/client/request';
import { candidateClientOptions } from './baseApi';
import type {
  CandidateCurrentTaskResponse,
  CandidateTaskSubmitResponse,
} from './typesApi';
import { normalizeTask } from './tasksNormalizeApi';
import { mapCurrentTaskError, mapSubmitTaskError } from './taskErrorsApi';

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function normalizeSubmitResponse(
  payload: CandidateTaskSubmitResponse,
): CandidateTaskSubmitResponse {
  if (!payload || typeof payload !== 'object') return payload;
  const rec = payload as Record<string, unknown>;
  return {
    ...payload,
    commitSha: asNullableString(rec.commitSha ?? rec.commit_sha),
    checkpointSha: asNullableString(rec.checkpointSha ?? rec.checkpoint_sha),
    finalSha: asNullableString(rec.finalSha ?? rec.final_sha),
  };
}

export async function getCandidateCurrentTask(
  candidateSessionId: number,
  options?: {
    signal?: AbortSignal;
    skipCache?: boolean;
    cacheTtlMs?: number;
    dedupeKey?: string;
  },
) {
  const path = `/candidate/session/${candidateSessionId}/current_task`;
  try {
    const { data } = await requestWithMeta<CandidateCurrentTaskResponse>(
      path,
      {
        headers: { 'x-candidate-session-id': String(candidateSessionId) },
        cache: 'no-store',
        signal: options?.signal,
        skipCache: options?.skipCache,
        cacheTtlMs: options?.cacheTtlMs,
        dedupeKey: options?.dedupeKey,
      },
      candidateClientOptions,
    );
    const currentTask = normalizeTask(data?.currentTask);
    return {
      ...data,
      currentTask,
      completedTaskIds:
        data?.completedTaskIds ?? data?.progress?.completedTaskIds ?? [],
    };
  } catch (err) {
    mapCurrentTaskError(err);
  }
}

export async function submitCandidateTask(params: {
  taskId: number;
  candidateSessionId: number;
  contentText?: string;
  reflection?: {
    challenges: string;
    decisions: string;
    tradeoffs: string;
    communication: string;
    next: string;
  };
}) {
  const { taskId, candidateSessionId, contentText, reflection } = params;
  const path = `/tasks/${taskId}/submit`;
  const payload: Record<string, unknown> = {};
  if (typeof contentText === 'string') payload.contentText = contentText;
  if (reflection && typeof reflection === 'object') {
    payload.reflection = { ...reflection };
  }
  try {
    const { data } = await requestWithMeta<CandidateTaskSubmitResponse>(
      path,
      {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-session-id': String(candidateSessionId),
        },
        cache: 'no-store',
      },
      candidateClientOptions,
    );
    return normalizeSubmitResponse(data);
  } catch (err) {
    mapSubmitTaskError(err);
  }
}
