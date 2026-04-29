import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import type { SubmitPayload, SubmitResponse, Task } from '../../types';

export type UseDay5ReflectionFormStateArgs = {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
};
