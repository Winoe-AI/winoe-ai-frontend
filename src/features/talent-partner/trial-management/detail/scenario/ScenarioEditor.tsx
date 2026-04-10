'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ScenarioPatchPayload } from '@/features/talent-partner/api/trialLifecycleApi';
import { ScenarioEditorFields } from './ScenarioEditorFields';
import { ScenarioEditorHeader } from './ScenarioEditorHeader';
import type {
  ScenarioEditorDraft,
  ScenarioEditorProps,
} from './ScenarioEditor.types';
import {
  parseRubric,
  parseTaskPrompts,
  stringifyJson,
} from './scenarioEditorJson';

export type { ScenarioEditorDraft };

export function ScenarioEditor({
  versionId,
  disabled,
  disabledReason,
  saving,
  initialStoryline,
  initialTaskPrompts,
  initialRubric,
  serverFieldErrors,
  saveError,
  onSave,
  draft,
  onDraftChange,
}: ScenarioEditorProps) {
  const initialStorylineInput = useMemo(
    () => initialStoryline ?? '',
    [initialStoryline],
  );
  const initialTaskPromptsInput = useMemo(
    () => stringifyJson(initialTaskPrompts, '[]'),
    [initialTaskPrompts],
  );
  const initialRubricInput = useMemo(
    () => stringifyJson(initialRubric, '{}'),
    [initialRubric],
  );
  const [storylineInput, setStorylineInput] = useState(
    draft?.storylineInput ?? initialStorylineInput,
  );
  const [taskPromptsInput, setTaskPromptsInput] = useState(
    draft?.taskPromptsInput ?? initialTaskPromptsInput,
  );
  const [rubricInput, setRubricInput] = useState(
    draft?.rubricInput ?? initialRubricInput,
  );
  const taskPromptsParsed = useMemo(
    () => parseTaskPrompts(taskPromptsInput),
    [taskPromptsInput],
  );
  const rubricParsed = useMemo(() => parseRubric(rubricInput), [rubricInput]);
  const changedStoryline = storylineInput !== initialStorylineInput;
  const changedTaskPrompts = taskPromptsInput !== initialTaskPromptsInput;
  const changedRubric = rubricInput !== initialRubricInput;
  const isDirty = changedStoryline || changedTaskPrompts || changedRubric;
  const hasValidationError = Boolean(
    taskPromptsParsed.error || rubricParsed.error,
  );
  const saveDisabled =
    !versionId || disabled || saving || !isDirty || hasValidationError;

  useEffect(() => {
    if (!versionId || !onDraftChange) return;
    onDraftChange(versionId, {
      storylineInput,
      taskPromptsInput,
      rubricInput,
      isDirty,
    });
  }, [
    isDirty,
    onDraftChange,
    rubricInput,
    storylineInput,
    taskPromptsInput,
    versionId,
  ]);

  const onClickSave = () => {
    if (!versionId || saveDisabled) return;
    const payload: ScenarioPatchPayload = {};
    if (changedStoryline) payload.storylineMd = storylineInput;
    if (changedTaskPrompts && taskPromptsParsed.value)
      payload.taskPrompts = taskPromptsParsed.value;
    if (changedRubric && rubricParsed.value)
      payload.rubric = rubricParsed.value;
    if (!Object.keys(payload).length) return;
    void onSave(payload);
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <ScenarioEditorHeader
        saveDisabled={saveDisabled}
        saving={saving}
        onClickSave={onClickSave}
        disabled={disabled}
        disabledReason={disabledReason}
        saveError={saveError}
      />
      <ScenarioEditorFields
        disabled={disabled}
        storylineInput={storylineInput}
        taskPromptsInput={taskPromptsInput}
        rubricInput={rubricInput}
        taskPromptsError={taskPromptsParsed.error ?? undefined}
        rubricError={rubricParsed.error ?? undefined}
        serverFieldErrors={serverFieldErrors}
        onStorylineChange={setStorylineInput}
        onTaskPromptsChange={setTaskPromptsInput}
        onRubricChange={setRubricInput}
      />
    </div>
  );
}
