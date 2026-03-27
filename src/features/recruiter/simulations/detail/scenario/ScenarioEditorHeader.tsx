'use client';
import Button from '@/shared/ui/Button';

type ScenarioEditorHeaderProps = {
  saveDisabled: boolean;
  saving: boolean;
  onClickSave: () => void;
  disabled: boolean;
  disabledReason?: string | null;
  saveError?: string | null;
};

export function ScenarioEditorHeader({
  saveDisabled,
  saving,
  onClickSave,
  disabled,
  disabledReason,
  saveError,
}: ScenarioEditorHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Scenario editor</h3>
          <p className="text-xs text-gray-600">
            Edit storyline, task prompts, and rubric before approval.
          </p>
        </div>
        <Button size="sm" onClick={onClickSave} loading={saving} disabled={saveDisabled}>
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
    </>
  );
}
