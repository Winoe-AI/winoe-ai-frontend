'use client';

import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';
import {
  ScenarioEditor,
  type ScenarioEditorDraft,
  ScenarioLockBanner,
  ScenarioVersionSelector,
  ScenarioVersionSummary,
} from '../scenario';
import type { ScenarioVersionItem } from '../scenario/types';

type Props = {
  versions: ScenarioVersionItem[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  selectedVersion: ScenarioVersionItem | null;
  previousVersion: ScenarioVersionItem | null;
  lockBannerMessage: string | null;
  contentUnavailableMessage: string | null;
  generatingLabel: string | null;
  editorDisabled: boolean;
  editorDisabledReason: string | null;
  editorSaving: boolean;
  editorSaveError: string | null;
  editorFieldErrors: Partial<
    Record<'storylineMd' | 'taskPrompts' | 'rubric', string>
  >;
  onSave: (payload: ScenarioPatchPayload) => Promise<void> | void;
  editorDraft: ScenarioEditorDraft | null;
  onEditorDraftChange: (versionId: string, draft: ScenarioEditorDraft) => void;
};

export function ScenarioControlsSection({
  versions,
  selectedVersionId,
  onSelectVersion,
  selectedVersion,
  previousVersion,
  lockBannerMessage,
  contentUnavailableMessage,
  generatingLabel,
  editorDisabled,
  editorDisabledReason,
  editorSaving,
  editorSaveError,
  editorFieldErrors,
  onSave,
  editorDraft,
  onEditorDraftChange,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <ScenarioVersionSelector
        versions={versions}
        selectedVersionId={selectedVersionId}
        onSelectVersion={onSelectVersion}
      />

      <div className="mt-3 space-y-3">
        <ScenarioVersionSummary
          selected={selectedVersion}
          previous={previousVersion}
        />
        {generatingLabel ? (
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {generatingLabel}
          </div>
        ) : null}
        {lockBannerMessage ? (
          <ScenarioLockBanner message={lockBannerMessage} />
        ) : null}
        {contentUnavailableMessage ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            {contentUnavailableMessage}
          </div>
        ) : null}
        <ScenarioEditor
          key={selectedVersion?.id ?? 'scenario-editor-empty'}
          versionId={selectedVersion?.id ?? null}
          disabled={editorDisabled}
          disabledReason={editorDisabledReason}
          saving={editorSaving}
          initialStoryline={selectedVersion?.storylineMd ?? null}
          initialTaskPrompts={selectedVersion?.taskPrompts ?? null}
          initialRubric={selectedVersion?.rubric ?? null}
          serverFieldErrors={editorFieldErrors}
          saveError={editorSaveError}
          onSave={onSave}
          draft={editorDraft}
          onDraftChange={onEditorDraftChange}
        />
      </div>
    </div>
  );
}
