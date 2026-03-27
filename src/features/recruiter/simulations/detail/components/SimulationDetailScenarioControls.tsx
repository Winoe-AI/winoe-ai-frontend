import type { SimulationDetailViewProps } from './types';
import { ScenarioControlsSectionComponent } from './SimulationScenarioControlsComponent';

type SimulationDetailScenarioControlsProps = {
  props: SimulationDetailViewProps;
  showScenarioControls: boolean;
};

export function SimulationDetailScenarioControls({
  props,
  showScenarioControls,
}: SimulationDetailScenarioControlsProps) {
  if (!showScenarioControls) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">Preparing scenario controls...</div>
      </div>
    );
  }

  return (
    <ScenarioControlsSectionComponent
      versions={props.scenarioVersions}
      selectedVersionId={props.selectedScenarioVersionId}
      onSelectVersion={props.onSelectScenarioVersion}
      selectedVersion={props.selectedScenarioVersion}
      previousVersion={props.previousScenarioVersion}
      lockBannerMessage={props.scenarioLockBannerMessage}
      contentUnavailableMessage={props.scenarioContentUnavailableMessage}
      generatingLabel={props.scenarioGeneratingLabel}
      editorDisabled={props.scenarioEditorDisabled}
      editorDisabledReason={props.scenarioEditorDisabledReason}
      editorSaving={props.scenarioEditorSaving}
      editorSaveError={props.scenarioEditorSaveError}
      editorFieldErrors={props.scenarioEditorFieldErrors}
      editorDraft={props.scenarioEditorDraft}
      onEditorDraftChange={props.onScenarioEditorDraftChange}
      onSave={props.onSaveScenarioEdits}
    />
  );
}
