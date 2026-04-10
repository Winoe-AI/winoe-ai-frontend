import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  RegenerationPollState,
  ScenarioEditorFieldErrors,
  ScenarioVersionSnapshot,
} from '../types';

type ScenarioState = {
  trialId: string;
  scenarioVersionSnapshots: Record<string, ScenarioVersionSnapshot>;
  scenarioEditorSaving: boolean;
  scenarioEditorSaveError: string | null;
  scenarioEditorFieldErrors: ScenarioEditorFieldErrors;
  scenarioLockBannerMessage: string | null;
  pendingRegeneration: RegenerationPollState | null;
};

type ScenarioStateKey = Exclude<keyof ScenarioState, 'trialId'>;

function createInitialState(trialId: string): ScenarioState {
  return {
    trialId,
    scenarioVersionSnapshots: {},
    scenarioEditorSaving: false,
    scenarioEditorSaveError: null,
    scenarioEditorFieldErrors: {},
    scenarioLockBannerMessage: null,
    pendingRegeneration: null,
  };
}

function resolveStateAction<T>(action: SetStateAction<T>, currentValue: T): T {
  return typeof action === 'function'
    ? (action as (previousState: T) => T)(currentValue)
    : action;
}

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
  setScenarioEditorFieldErrors: Dispatch<
    SetStateAction<ScenarioEditorFieldErrors>
  >;
  scenarioLockBannerMessage: string | null;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  pendingRegeneration: RegenerationPollState | null;
  setPendingRegeneration: Dispatch<
    SetStateAction<RegenerationPollState | null>
  >;
};

export function useScenarioVersionState(trialId: string): StateModel {
  const latestTrialIdRef = useRef(trialId);
  const [state, setState] = useState<ScenarioState>(() =>
    createInitialState(trialId),
  );

  useEffect(() => {
    latestTrialIdRef.current = trialId;
  }, [trialId]);

  const resolvedState =
    state.trialId === trialId ? state : createInitialState(trialId);

  const updateField = useCallback(
    <Key extends ScenarioStateKey>(
      key: Key,
      action: SetStateAction<ScenarioState[Key]>,
    ) => {
      setState((currentState) => {
        if (latestTrialIdRef.current !== trialId) {
          return currentState;
        }
        const baseState =
          currentState.trialId === trialId
            ? currentState
            : createInitialState(trialId);
        const nextValue = resolveStateAction(action, baseState[key]);
        if (Object.is(nextValue, baseState[key])) {
          return baseState;
        }
        return {
          ...baseState,
          trialId,
          [key]: nextValue,
        };
      });
    },
    [trialId],
  );

  const setScenarioVersionSnapshots = useCallback<
    Dispatch<SetStateAction<Record<string, ScenarioVersionSnapshot>>>
  >((action) => updateField('scenarioVersionSnapshots', action), [updateField]);
  const setScenarioEditorSaving = useCallback<
    Dispatch<SetStateAction<boolean>>
  >((action) => updateField('scenarioEditorSaving', action), [updateField]);
  const setScenarioEditorSaveError = useCallback<
    Dispatch<SetStateAction<string | null>>
  >((action) => updateField('scenarioEditorSaveError', action), [updateField]);
  const setScenarioEditorFieldErrors = useCallback<
    Dispatch<SetStateAction<ScenarioEditorFieldErrors>>
  >(
    (action) => updateField('scenarioEditorFieldErrors', action),
    [updateField],
  );
  const setScenarioLockBannerMessage = useCallback<
    Dispatch<SetStateAction<string | null>>
  >(
    (action) => updateField('scenarioLockBannerMessage', action),
    [updateField],
  );
  const setPendingRegeneration = useCallback<
    Dispatch<SetStateAction<RegenerationPollState | null>>
  >((action) => updateField('pendingRegeneration', action), [updateField]);

  return {
    scenarioVersionSnapshots: resolvedState.scenarioVersionSnapshots,
    setScenarioVersionSnapshots,
    scenarioEditorSaving: resolvedState.scenarioEditorSaving,
    setScenarioEditorSaving,
    scenarioEditorSaveError: resolvedState.scenarioEditorSaveError,
    setScenarioEditorSaveError,
    scenarioEditorFieldErrors: resolvedState.scenarioEditorFieldErrors,
    setScenarioEditorFieldErrors,
    scenarioLockBannerMessage: resolvedState.scenarioLockBannerMessage,
    setScenarioLockBannerMessage,
    pendingRegeneration: resolvedState.pendingRegeneration,
    setPendingRegeneration,
  };
}
