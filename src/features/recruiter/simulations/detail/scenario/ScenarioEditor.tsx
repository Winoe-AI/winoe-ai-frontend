'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';
import Button from '@/shared/ui/Button';

type ScenarioEditorField = 'storylineMd' | 'taskPrompts' | 'rubric';

type FieldErrors = Partial<Record<ScenarioEditorField, string>>;

export type ScenarioEditorDraft = {
  storylineInput: string;
  taskPromptsInput: string;
  rubricInput: string;
  isDirty: boolean;
};

type Props = {
  versionId: string | null;
  disabled: boolean;
  disabledReason?: string | null;
  saving: boolean;
  initialStoryline: string | null;
  initialTaskPrompts: Array<Record<string, unknown>> | null;
  initialRubric: Record<string, unknown> | null;
  serverFieldErrors?: FieldErrors;
  saveError?: string | null;
  onSave: (payload: ScenarioPatchPayload) => Promise<void> | void;
  draft?: ScenarioEditorDraft | null;
  onDraftChange?: (versionId: string, draft: ScenarioEditorDraft) => void;
};

function stringifyJson(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  try {
    const serialized = JSON.stringify(value, null, 2);
    return typeof serialized === 'string' ? serialized : fallback;
  } catch {
    return fallback;
  }
}

function parseTaskPrompts(input: string): {
  value: Array<Record<string, unknown>> | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      return { value: null, error: 'Task prompts must be a JSON array.' };
    }
    return {
      value: parsed as Array<Record<string, unknown>>,
      error: null,
    };
  } catch {
    return { value: null, error: 'Task prompts JSON is invalid.' };
  }
}

function parseRubric(input: string): {
  value: Record<string, unknown> | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { value: null, error: 'Rubric must be a JSON object.' };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch {
    return { value: null, error: 'Rubric JSON is invalid.' };
  }
}

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
}: Props) {
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
    if (changedStoryline) {
      payload.storylineMd = storylineInput;
    }
    if (changedTaskPrompts && taskPromptsParsed.value) {
      payload.taskPrompts = taskPromptsParsed.value;
    }
    if (changedRubric && rubricParsed.value) {
      payload.rubric = rubricParsed.value;
    }

    if (!Object.keys(payload).length) return;
    void onSave(payload);
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Scenario editor
          </h3>
          <p className="text-xs text-gray-600">
            Edit storyline, task prompts, and rubric before approval.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onClickSave}
          loading={saving}
          disabled={saveDisabled}
        >
          Save edits
        </Button>
      </div>

      {disabled && disabledReason ? (
        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          {disabledReason}
        </div>
      ) : null}

      {saveError ? (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {saveError}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            storyline (markdown)
          </span>
          <textarea
            className="min-h-28 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            value={storylineInput}
            onChange={(event) => setStorylineInput(event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(serverFieldErrors?.storylineMd)}
          />
          {serverFieldErrors?.storylineMd ? (
            <span className="text-xs text-red-700">
              {serverFieldErrors.storylineMd}
            </span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            task prompts (json)
          </span>
          <textarea
            className="min-h-40 rounded border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
            value={taskPromptsInput}
            onChange={(event) => setTaskPromptsInput(event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(
              taskPromptsParsed.error || serverFieldErrors?.taskPrompts,
            )}
          />
          {taskPromptsParsed.error ? (
            <span className="text-xs text-red-700">
              {taskPromptsParsed.error}
            </span>
          ) : null}
          {serverFieldErrors?.taskPrompts ? (
            <span className="text-xs text-red-700">
              {serverFieldErrors.taskPrompts}
            </span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            rubric (json)
          </span>
          <textarea
            className="min-h-40 rounded border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
            value={rubricInput}
            onChange={(event) => setRubricInput(event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(
              rubricParsed.error || serverFieldErrors?.rubric,
            )}
          />
          {rubricParsed.error ? (
            <span className="text-xs text-red-700">{rubricParsed.error}</span>
          ) : null}
          {serverFieldErrors?.rubric ? (
            <span className="text-xs text-red-700">
              {serverFieldErrors.rubric}
            </span>
          ) : null}
        </label>
      </div>
    </div>
  );
}
