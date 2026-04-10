export type TrialActionResult<TData = unknown> = {
  ok: boolean;
  statusCode?: number | null;
  message?: string | null;
  unsupported?: boolean;
  errorCode?: string | null;
  details?: Record<string, unknown> | null;
  data?: TData;
};

export type TrialJobStatus = {
  jobId: string;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

export type ScenarioRegenerateResponse = {
  scenarioVersionId: string;
  jobId: string | null;
  status: string | null;
};

export type ScenarioApproveResponse = {
  trialId: string;
  status: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
};

export type ScenarioPatchPayload = {
  storylineMd?: string | null;
  taskPrompts?: Array<Record<string, unknown>>;
  rubric?: Record<string, unknown>;
  notes?: string | null;
};

export type ScenarioPatchResponse = {
  scenarioVersionId: string;
  status: string | null;
};
