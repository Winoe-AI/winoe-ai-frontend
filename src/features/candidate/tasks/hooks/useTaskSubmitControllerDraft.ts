import { useCallback, useEffect, useRef, useState } from 'react';
import { markTextDraftSavedAt } from '../utils/draftStorageUtils';
import type { Task } from '../types';
import { useTaskDraftAutosave } from './useTaskDraftAutosave';
import { pickTextFromStructuredJson } from './useTaskSubmitControllerContent';

type UseTaskSubmitControllerDraftArgs = {
  task: Task;
  candidateSessionId: number | null;
  textTask: boolean;
  disabled: boolean;
  readOnly: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function useTaskSubmitControllerDraft({
  task,
  candidateSessionId,
  textTask,
  disabled,
  readOnly,
  onTaskWindowClosed,
}: UseTaskSubmitControllerDraftArgs) {
  const [text, setText] = useState('');
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const draftAutosave = useTaskDraftAutosave<string>({
    taskId: task.id,
    candidateSessionId,
    isEditable: textTask && !disabled,
    hasFinalizedContent: !textTask || readOnly,
    value: text,
    serialize: useCallback(
      (value: string) =>
        task.dayIndex === 5
          ? { contentText: value, contentJson: { reflectionMarkdown: value } }
          : { contentText: value },
      [task.dayIndex],
    ),
    deserialize: useCallback(
      (draft) => {
        if (task.dayIndex === 5) {
          const structured = pickTextFromStructuredJson(draft.contentJson);
          if (structured && structured.trim()) return structured;
        }
        const textValue = draft.contentText ?? '';
        return textValue.trim() ? textValue : null;
      },
      [task.dayIndex],
    ),
    onRestore: setText,
    onTaskWindowClosed,
    onSavedAt: useCallback(
      (savedAtMs: number) => {
        markTextDraftSavedAt(task.id, savedAtMs);
      },
      [task.id],
    ),
  });

  return {
    text,
    setText,
    textRef,
    draftAutosave,
    saveDraftNow: () => void draftAutosave.flushNow(),
    clearDrafts: () => {},
  };
}
