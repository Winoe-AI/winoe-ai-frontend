import type { ScenarioEditorDraft, ScenarioVersionItem } from '../scenario';
import type {
  ScenarioContentAvailability,
  SimulationDetailPreview,
} from '../utils/detailUtils';
import type { SimulationPlan } from '../utils/plan';

export type ScenarioVersionSnapshot = {
  id: string;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  contentAvailability: ScenarioContentAvailability;
  storylineMd: string | null;
  taskPrompts: Array<Record<string, unknown>> | null;
  rubric: Record<string, unknown> | null;
};

export type ScenarioEditorFieldErrors = Partial<
  Record<'storylineMd' | 'taskPrompts' | 'rubric', string>
>;

export type RegenerationPollState = {
  jobId: string;
  scenarioVersionId: string;
  pollAfterMs: number | null;
  attempt: number;
};

export type PlanDaySlot = {
  dayIndex: number;
  task: SimulationPlan['days'][number] | null;
  aiEvaluationEnabled: boolean;
};

export type ScenarioUiStatusArgs = {
  snapshot: ScenarioVersionSnapshot;
  simulationStatus: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  regeneratingScenarioVersionId: string | null;
  globalGenerating: boolean;
};

export type SelectedScenarioDisplayStatusArgs = {
  selectedScenarioVersion: ScenarioVersionItem | null;
  simulationStatus: string | null;
};

export type ScenarioSnapshotFromDetailArgs = {
  detail: SimulationDetailPreview;
  fallbackTaskPrompts: Array<Record<string, unknown>> | null;
};

export type ScenarioEditorDraftPair = {
  left: ScenarioEditorDraft | undefined;
  right: ScenarioEditorDraft;
};
