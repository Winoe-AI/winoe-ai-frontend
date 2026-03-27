'use client';
import type { ScenarioEditorFieldErrors } from './ScenarioEditor.types';

type ScenarioEditorFieldsProps = {
  disabled: boolean;
  storylineInput: string;
  taskPromptsInput: string;
  rubricInput: string;
  storylineError?: string;
  taskPromptsError?: string;
  rubricError?: string;
  serverFieldErrors?: ScenarioEditorFieldErrors;
  onStorylineChange: (value: string) => void;
  onTaskPromptsChange: (value: string) => void;
  onRubricChange: (value: string) => void;
};

export function ScenarioEditorFields({
  disabled,
  storylineInput,
  taskPromptsInput,
  rubricInput,
  storylineError,
  taskPromptsError,
  rubricError,
  serverFieldErrors,
  onStorylineChange,
  onTaskPromptsChange,
  onRubricChange,
}: ScenarioEditorFieldsProps) {
  return (
    <div className="mt-3 grid gap-3">
      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          storyline (markdown)
        </span>
        <textarea
          className="min-h-28 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          value={storylineInput}
          onChange={(event) => onStorylineChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(storylineError || serverFieldErrors?.storylineMd)}
        />
        {storylineError ? <span className="text-xs text-red-700">{storylineError}</span> : null}
        {serverFieldErrors?.storylineMd ? (
          <span className="text-xs text-red-700">{serverFieldErrors.storylineMd}</span>
        ) : null}
      </label>

      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          task prompts (json)
        </span>
        <textarea
          className="min-h-40 rounded border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
          value={taskPromptsInput}
          onChange={(event) => onTaskPromptsChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(taskPromptsError || serverFieldErrors?.taskPrompts)}
        />
        {taskPromptsError ? (
          <span className="text-xs text-red-700">{taskPromptsError}</span>
        ) : null}
        {serverFieldErrors?.taskPrompts ? (
          <span className="text-xs text-red-700">{serverFieldErrors.taskPrompts}</span>
        ) : null}
      </label>

      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          rubric (json)
        </span>
        <textarea
          className="min-h-40 rounded border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
          value={rubricInput}
          onChange={(event) => onRubricChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(rubricError || serverFieldErrors?.rubric)}
        />
        {rubricError ? <span className="text-xs text-red-700">{rubricError}</span> : null}
        {serverFieldErrors?.rubric ? (
          <span className="text-xs text-red-700">{serverFieldErrors.rubric}</span>
        ) : null}
      </label>
    </div>
  );
}
