import { useCallback } from 'react';
import { useTaskDraftAutosave } from '../../hooks/useTaskDraftAutosave';
import { markTextDraftSavedAt } from '../../utils/draftStorageUtils';
import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayload,
  extractDay5SectionsFromContentJson,
  hasDay5SectionContent,
  type Day5ReflectionSections,
} from '../../utils/day5ReflectionUtils';
import {
  emptyTouchedMap,
  type Day5FormSetters,
} from './day5ReflectionForm.types';

type UseDay5ReflectionDraftAutosaveArgs = {
  taskId: number;
  candidateSessionId: number | null;
  readOnly: boolean;
  sections: Day5ReflectionSections;
  onTaskWindowClosed?: (err: unknown) => void;
  setters: Day5FormSetters;
};

export function useDay5ReflectionDraftAutosave({
  taskId,
  candidateSessionId,
  readOnly,
  sections,
  onTaskWindowClosed,
  setters,
}: UseDay5ReflectionDraftAutosaveArgs) {
  return useTaskDraftAutosave<Day5ReflectionSections>({
    taskId,
    candidateSessionId,
    isEditable: !readOnly,
    hasFinalizedContent: readOnly,
    value: sections,
    serialize: useCallback((value) => {
      const reflection = buildDay5ReflectionPayload(value);
      return {
        contentText: buildDay5ReflectionContentText(reflection),
        contentJson: { reflection },
      };
    }, []),
    deserialize: useCallback((draft) => {
      const fromJson = extractDay5SectionsFromContentJson(draft.contentJson);
      if (hasDay5SectionContent(fromJson)) return fromJson;
      return null;
    }, []),
    onRestore: useCallback(
      (restored) => {
        setters.setSections(restored);
        setters.setTouched(emptyTouchedMap());
        setters.setSubmitAttempted(false);
        setters.setBackendFieldErrors({});
        setters.setLocalFormError(null);
      },
      [setters],
    ),
    onTaskWindowClosed,
    onSavedAt: useCallback(
      (savedAtMs: number) => {
        markTextDraftSavedAt(taskId, savedAtMs);
      },
      [taskId],
    ),
  });
}
