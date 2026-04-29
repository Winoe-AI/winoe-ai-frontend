import { useCallback } from 'react';
import { useTaskDraftAutosave } from '../../hooks/useTaskDraftAutosave';
import { markTextDraftSavedAt } from '../../utils/draftStorageUtils';
import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionMarkdownTemplate,
  extractDay5SectionsFromContentJson,
  hasDay5SectionContent,
} from '../../utils/day5ReflectionUtils';

type UseDay5ReflectionDraftAutosaveArgs = {
  taskId: number;
  candidateSessionId: number | null;
  readOnly: boolean;
  markdown: string;
  onTaskWindowClosed?: (err: unknown) => void;
  onRestore: (markdown: string) => void;
};

export function useDay5ReflectionDraftAutosave({
  taskId,
  candidateSessionId,
  readOnly,
  markdown,
  onTaskWindowClosed,
  onRestore,
}: UseDay5ReflectionDraftAutosaveArgs) {
  return useTaskDraftAutosave<string>({
    taskId,
    candidateSessionId,
    isEditable: !readOnly,
    hasFinalizedContent: readOnly,
    value: markdown,
    serialize: useCallback((value) => {
      return {
        contentText: value,
        contentJson: {
          reflectionMarkdown: value,
          reflection: extractDay5SectionsFromContentJson({
            reflectionMarkdown: value,
          }),
        },
      };
    }, []),
    deserialize: useCallback((draft) => {
      const contentText =
        typeof draft.contentText === 'string' ? draft.contentText : '';
      if (contentText.trim()) return contentText;
      const structured = extractDay5SectionsFromContentJson(draft.contentJson);
      if (hasDay5SectionContent(structured)) {
        const markdown = buildDay5ReflectionContentText(structured).trim();
        if (markdown) return markdown;
      }
      const template = buildDay5ReflectionMarkdownTemplate().trim();
      return template || null;
    }, []),
    onRestore: useCallback(
      (restored) => {
        onRestore(restored);
      },
      [onRestore],
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
