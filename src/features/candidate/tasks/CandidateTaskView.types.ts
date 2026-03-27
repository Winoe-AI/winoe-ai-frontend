import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import type { SubmitPayload, SubmitResponse, Task } from './types';

export type CandidateTaskViewProps = {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate?: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
};

export type Day5ReflectionPanelProps = {
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

export type HandoffUploadPanelProps = {
  candidateSessionId: number | null;
  task: Task;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
};

export const DEFAULT_ACTION_GATE: WindowActionGate = {
  isReadOnly: false,
  disabledReason: null,
  comeBackAt: null,
};
