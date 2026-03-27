import type { Dispatch, SetStateAction } from 'react';
import type {
  RegenerationPollState,
  ScenarioEditorFieldErrors,
  ScenarioVersionSnapshot,
} from '../types';
import type { ScenarioEditorDraft, ScenarioVersionItem } from '../../scenario';

export type UseSimulationScenarioActionsArgs = {
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioVersionId: string | null;
  selectedScenarioVersionIndex: number | null;
  selectedScenarioVersion: ScenarioVersionItem | null;
  canApprove: boolean;
  pendingScenarioVersionId: string | null;
  refreshPlan: () => Promise<void>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  scenarioVersionSnapshots: Record<string, ScenarioVersionSnapshot>;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
  scenarioEditorDisabled: boolean;
  scenarioEditorSaving: boolean;
  setScenarioEditorSaving: Dispatch<SetStateAction<boolean>>;
  scenarioEditorSaveError: string | null;
  setScenarioEditorSaveError: Dispatch<SetStateAction<string | null>>;
  setScenarioEditorFieldErrors: Dispatch<
    SetStateAction<ScenarioEditorFieldErrors>
  >;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  setPendingRegeneration: Dispatch<
    SetStateAction<RegenerationPollState | null>
  >;
  setSelectedScenarioVersionId: Dispatch<SetStateAction<string | null>>;
};

export type ScenarioEditorDraftMap = Record<string, ScenarioEditorDraft>;
