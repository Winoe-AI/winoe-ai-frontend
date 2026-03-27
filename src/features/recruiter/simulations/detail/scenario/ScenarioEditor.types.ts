import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';

export type ScenarioEditorField = 'storylineMd' | 'taskPrompts' | 'rubric';

export type ScenarioEditorFieldErrors = Partial<Record<ScenarioEditorField, string>>;

export type ScenarioEditorDraft = {
  storylineInput: string;
  taskPromptsInput: string;
  rubricInput: string;
  isDirty: boolean;
};

export type ScenarioEditorProps = {
  versionId: string | null;
  disabled: boolean;
  disabledReason?: string | null;
  saving: boolean;
  initialStoryline: string | null;
  initialTaskPrompts: Array<Record<string, unknown>> | null;
  initialRubric: Record<string, unknown> | null;
  serverFieldErrors?: ScenarioEditorFieldErrors;
  saveError?: string | null;
  onSave: (payload: ScenarioPatchPayload) => Promise<void> | void;
  draft?: ScenarioEditorDraft | null;
  onDraftChange?: (versionId: string, draft: ScenarioEditorDraft) => void;
};
