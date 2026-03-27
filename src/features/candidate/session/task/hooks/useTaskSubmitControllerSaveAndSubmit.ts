import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { isSubmitResponse } from '../utils/taskGuards';
import type { SubmitPayload } from '../types';
import { toCodingShaRefs, type DurableCodingSubmission } from './taskSubmitControllerContent';

type UseTaskSubmitControllerSaveAndSubmitArgs = {
  taskId: number;
  actionStatus: 'idle' | 'submitting' | 'submitted';
  disabled: boolean;
  githubNative: boolean;
  textTask: boolean;
  textRef: RefObject<string>;
  handleSubmit: (payload: SubmitPayload) => Promise<unknown>;
  clearDrafts: () => void;
  setRecordedCodingSubmission: Dispatch<SetStateAction<DurableCodingSubmission | null>>;
};

export function useTaskSubmitControllerSaveAndSubmit({
  taskId,
  actionStatus,
  disabled,
  githubNative,
  textTask,
  textRef,
  handleSubmit,
  clearDrafts,
  setRecordedCodingSubmission,
}: UseTaskSubmitControllerSaveAndSubmitArgs) {
  const [localError, setLocalError] = useState<string | null>(null);

  const saveAndSubmit = useCallback(async () => {
    if (disabled || actionStatus !== 'idle') return;
    if (githubNative) {
      setLocalError(null);
      const resp = await handleSubmit({});
      if (isSubmitResponse(resp)) {
        setRecordedCodingSubmission({
          taskId,
          progress: resp.progress,
          shaRefs: toCodingShaRefs(resp),
        });
      }
      if (resp !== 'submit-failed') clearDrafts();
      return;
    }
    if (textTask) {
      const trimmed = textRef.current?.trim() ?? '';
      if (!trimmed) {
        setLocalError('Please enter an answer before submitting.');
        return;
      }
      setLocalError(null);
      const resp = await handleSubmit({ contentText: trimmed });
      if (resp !== 'submit-failed') clearDrafts();
      return;
    }
    setLocalError(null);
    const resp = await handleSubmit({});
    if (resp !== 'submit-failed') clearDrafts();
  }, [actionStatus, clearDrafts, disabled, githubNative, handleSubmit, setRecordedCodingSubmission, taskId, textRef, textTask]);

  return { localError, saveAndSubmit };
}
