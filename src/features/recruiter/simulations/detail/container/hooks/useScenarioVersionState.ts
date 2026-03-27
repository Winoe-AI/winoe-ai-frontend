import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type {
  RegenerationPollState,
  ScenarioEditorFieldErrors,
  ScenarioVersionSnapshot,
} from '../types';

type StateModel = {
  scenarioVersionSnapshots: Record<string, ScenarioVersionSnapshot>;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
  scenarioEditorSaving: boolean;
  setScenarioEditorSaving: Dispatch<SetStateAction<boolean>>;
  scenarioEditorSaveError: string | null;
  setScenarioEditorSaveError: Dispatch<SetStateAction<string | null>>;
  scenarioEditorFieldErrors: ScenarioEditorFieldErrors;
  setScenarioEditorFieldErrors: Dispatch<SetStateAction<ScenarioEditorFieldErrors>>;
  scenarioLockBannerMessage: string | null;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  pendingRegeneration: RegenerationPollState | null;
  setPendingRegeneration: Dispatch<SetStateAction<RegenerationPollState | null>>;
};

export function useScenarioVersionState(simulationId: string): StateModel {
  const [scenarioVersionSnapshots, setScenarioVersionSnapshots] = useState<
    Record<string, ScenarioVersionSnapshot>
  >({});
  const [scenarioEditorSaving, setScenarioEditorSaving] = useState(false);
  const [scenarioEditorSaveError, setScenarioEditorSaveError] = useState<
    string | null
  >(null);
  const [scenarioEditorFieldErrors, setScenarioEditorFieldErrors] =
    useState<ScenarioEditorFieldErrors>({});
  const [scenarioLockBannerMessage, setScenarioLockBannerMessage] = useState<
    string | null
  >(null);
  const [pendingRegeneration, setPendingRegeneration] =
    useState<RegenerationPollState | null>(null);

  useEffect(() => {
    setScenarioVersionSnapshots({});
    setScenarioEditorSaving(false);
    setScenarioEditorSaveError(null);
    setScenarioEditorFieldErrors({});
    setScenarioLockBannerMessage(null);
    setPendingRegeneration(null);
  }, [simulationId]);

  return {
    scenarioVersionSnapshots,
    setScenarioVersionSnapshots,
    scenarioEditorSaving,
    setScenarioEditorSaving,
    scenarioEditorSaveError,
    setScenarioEditorSaveError,
    scenarioEditorFieldErrors,
    setScenarioEditorFieldErrors,
    scenarioLockBannerMessage,
    setScenarioLockBannerMessage,
    pendingRegeneration,
    setPendingRegeneration,
  };
}
