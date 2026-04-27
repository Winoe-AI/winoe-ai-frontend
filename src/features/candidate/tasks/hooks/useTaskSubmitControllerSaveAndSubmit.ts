import {
  useCallback,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { isSubmitResponse } from '../utils/taskGuardsUtils';
import type { SubmitPayload } from '../types';
import {
  toCodingShaRefs,
  type DurableCodingSubmission,
} from './useTaskSubmitControllerContent';

type UseTaskSubmitControllerSaveAndSubmitArgs = {
  taskId: number;
  actionStatus: 'idle' | 'submitting' | 'submitted';
  disabled: boolean;
  githubNative: boolean;
  textTask: boolean;
  textRef: RefObject<string>;
  handleSubmit: (payload: SubmitPayload) => Promise<unknown>;
  clearDrafts: () => void;
  setRecordedCodingSubmission: Dispatch<
    SetStateAction<DurableCodingSubmission | null>
  >;
  onTextSubmitted?: () => void;
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
  onTextSubmitted,
}: UseTaskSubmitControllerSaveAndSubmitArgs) {
  const [localError, setLocalError] = useState<string | null>(null);

  const saveAndSubmit = useCallback(async () => {
    if (disabled || actionStatus !== 'idle') return;
    const clearDraftsIfSubmitted = (resp: unknown) => {
      if (resp !== 'submit-failed') clearDrafts();
      return resp;
    };

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
      return clearDraftsIfSubmitted(resp);
    }

    if (textTask) {
      const trimmed = textRef.current?.trim() ?? '';
      if (!trimmed) {
        setLocalError('Please enter an answer before submitting.');
        return;
      }
      setLocalError(null);
      const resp = await handleSubmit({ contentText: trimmed });
      if (resp !== 'submit-failed') onTextSubmitted?.();
      return clearDraftsIfSubmitted(resp);
    }

    setLocalError(null);
    return clearDraftsIfSubmitted(await handleSubmit({}));
  }, [
    actionStatus,
    clearDrafts,
    disabled,
    githubNative,
    handleSubmit,
    onTextSubmitted,
    setRecordedCodingSubmission,
    taskId,
    textRef,
    textTask,
  ]);

  return { localError, saveAndSubmit };
}
