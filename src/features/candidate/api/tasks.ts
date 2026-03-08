import { requestWithMeta } from '@/lib/api/client/request';
import { candidateClientOptions } from './base';
import type {
  CandidateCurrentTaskResponse,
  CandidateTaskSubmitResponse,
} from './types';
import { normalizeTask } from './tasksNormalize';
import { mapCurrentTaskError, mapSubmitTaskError } from './taskErrors';

export async function getCandidateCurrentTask(
  candidateSessionId: number,
  options?: { skipCache?: boolean; cacheTtlMs?: number; dedupeKey?: string },
) {
  const path = `/candidate/session/${candidateSessionId}/current_task`;
  try {
    const { data } = await requestWithMeta<CandidateCurrentTaskResponse>(
      path,
      {
        headers: { 'x-candidate-session-id': String(candidateSessionId) },
        cache: 'no-store',
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
    return data;
  } catch (err) {
    mapSubmitTaskError(err);
  }
}
