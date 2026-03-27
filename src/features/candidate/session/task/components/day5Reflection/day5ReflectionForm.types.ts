import type { Dispatch, SetStateAction } from 'react';
import type { WindowActionGate } from '../../../lib/windowState';
import type { SubmitPayload, SubmitResponse, Task } from '../../types';
import type {
  Day5FieldErrors,
  Day5ReflectionSectionKey,
  Day5ReflectionSections,
} from '../../utils/day5Reflection';

export function emptyTouchedMap(): Record<Day5ReflectionSectionKey, boolean> {
  return {
    challenges: false,
    decisions: false,
    tradeoffs: false,
    communication: false,
    next: false,
  };
}

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

export type Day5FormSetters = {
  setSections: Dispatch<SetStateAction<Day5ReflectionSections>>;
  setTouched: Dispatch<SetStateAction<Record<Day5ReflectionSectionKey, boolean>>>;
  setSubmitAttempted: Dispatch<SetStateAction<boolean>>;
  setBackendFieldErrors: Dispatch<SetStateAction<Day5FieldErrors>>;
  setLocalFormError: Dispatch<SetStateAction<string | null>>;
};
