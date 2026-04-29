import type { ComponentType } from 'react';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';
import type { TaskDraftAutosaveStatus } from '../../hooks/useTaskDraftAutosave';

export type Day5DraftAutosaveState = {
  status: TaskDraftAutosaveStatus;
  lastSavedAt: number | null;
  restoreApplied: boolean;
  error: string | null;
};

export type Day5ReflectionEditableViewProps = {
  mode: 'write' | 'preview';
  previewPending: boolean;
  markdown: string;
  markdownPreview: string;
  displayStatus: string;
  submitting: boolean;
  draftAutosave: Day5DraftAutosaveState;
  PreviewComponent: ComponentType<MarkdownPreviewProps>;
  onModeChange: (next: 'write' | 'preview') => void;
  onMarkdownChange: (value: string) => void;
};
