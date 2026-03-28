import type { CandidateTaskMock } from './types';

export function makeCandidateTask(
  params: Pick<
    CandidateTaskMock,
    'id' | 'dayIndex' | 'type' | 'title' | 'description'
  > & {
    recordedSubmission?: CandidateTaskMock['recordedSubmission'];
  },
): CandidateTaskMock {
  return {
    id: params.id,
    dayIndex: params.dayIndex,
    type: params.type,
    title: params.title,
    description: params.description,
    recordedSubmission: params.recordedSubmission ?? null,
  };
}
