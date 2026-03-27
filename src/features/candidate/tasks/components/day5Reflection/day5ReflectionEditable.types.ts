import type { ComponentType } from 'react';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';
import type { TaskDraftAutosaveStatus } from '../../hooks/useTaskDraftAutosave';
import type {
  Day5FieldErrors,
  Day5ReflectionSectionKey,
  Day5ReflectionSections,
} from '../../utils/day5ReflectionUtils';

export type Day5DraftAutosaveState = {
  status: TaskDraftAutosaveStatus;
  lastSavedAt: number | null;
  restoreApplied: boolean;
  error: string | null;
};

export type Day5ReflectionEditableViewProps = {
  mode: 'write' | 'preview';
  previewPending: boolean;
  markdownPreview: string;
  submitAttempted: boolean;
  touched: Record<Day5ReflectionSectionKey, boolean>;
  backendFieldErrors: Day5FieldErrors;
  clientFieldMessages: Day5FieldErrors;
  sections: Day5ReflectionSections;
  displayStatus: string;
  submitting: boolean;
  draftAutosave: Day5DraftAutosaveState;
  PreviewComponent: ComponentType<MarkdownPreviewProps>;
  onModeChange: (next: 'write' | 'preview') => void;
  onSectionChange: (section: Day5ReflectionSectionKey, value: string) => void;
  onSectionBlur: (section: Day5ReflectionSectionKey) => void;
};
