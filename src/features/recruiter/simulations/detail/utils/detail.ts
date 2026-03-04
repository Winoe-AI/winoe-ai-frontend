import { toNumberOrNull, toStringOrCsv, toStringOrNull } from './parsing';
import { normalizeSimulationPlan, type SimulationPlan } from './plan';

export type SimulationLifecycleStatus =
  | 'draft'
  | 'generating'
  | 'ready_for_review'
  | 'active_inviting'
  | 'terminated';

export type SimulationScenarioVersion = {
  id: string | null;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  isLocked: boolean;
};

export type SimulationGenerationJob = {
  jobId: string | null;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

export type SimulationDetailPreview = {
  plan: SimulationPlan | null;
  status: SimulationLifecycleStatus | null;
  statusRaw: string | null;
  scenarioVersion: SimulationScenarioVersion;
  storyline: string | null;
  rubricSummary: string | null;
  level: string | null;
  companyContext: string | null;
  generationJob: SimulationGenerationJob | null;
  hasJobFailure: boolean;
};

const LIFECYCLE_STATUS: ReadonlyArray<SimulationLifecycleStatus> = [
  'draft',
  'generating',
  'ready_for_review',
  'active_inviting',
  'terminated',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return toStringOrNull(value);
}

function parseLifecycleStatus(
  value: unknown,
): SimulationLifecycleStatus | null {
  const status = toStringOrNull(value)?.toLowerCase() ?? null;
  if (!status) return null;
  if (LIFECYCLE_STATUS.includes(status as SimulationLifecycleStatus)) {
    return status as SimulationLifecycleStatus;
  }
  return null;
}

function parseVersionIndex(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed && parsed >= 1) return Math.floor(parsed);
  const str = toStringOrNull(value);
  if (!str) return null;
  const match = str.match(/(\d+)/);
  if (!match) return null;
  const maybe = Number(match[1]);
  if (!Number.isFinite(maybe) || maybe < 1) return null;
  return Math.floor(maybe);
}

function readCompanyContext(value: unknown): string | null {
  const asString = toStringOrCsv(value);
  if (asString) return asString;

  const record = asRecord(value);
  if (!record) return null;
  const domain = toStringOrNull(record.domain ?? record.companyDomain);
  const productArea = toStringOrNull(record.productArea ?? record.product_area);
  const context = toStringOrNull(
    record.context ?? record.summary ?? record.description,
  );

  const bits: string[] = [];
  if (domain) bits.push(`Domain: ${domain}`);
  if (productArea) bits.push(`Product: ${productArea}`);
  if (context) bits.push(context);
  return bits.length ? bits.join(' · ') : null;
}

function readStoryline(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
  plan: SimulationPlan | null,
): string | null {
  const topLevel = toStringOrNull(
    raw.storyline ??
      raw.prestart ??
      raw.preStart ??
      raw.pre_start ??
      raw.storylineMarkdown ??
      raw.storyline_markdown,
  );
  if (topLevel) return topLevel;

  if (scenario) {
    const scenarioText = toStringOrNull(
      scenario.storyline ??
        scenario.prestart ??
        scenario.preStart ??
        scenario.pre_start ??
        scenario.summary ??
        scenario.overview ??
        scenario.description,
    );
    if (scenarioText) return scenarioText;
  }

  return plan?.scenario ?? null;
}

function readRubricSummary(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): string | null {
  return (
    toStringOrNull(
      raw.rubricSummary ??
        raw.rubric_summary ??
        raw.rubricOverview ??
        raw.rubric_overview,
    ) ??
    (scenario
      ? toStringOrNull(
          scenario.rubricSummary ??
            scenario.rubric_summary ??
            scenario.rubricOverview ??
            scenario.rubric_overview,
        )
      : null)
  );
}

function readErrorInfo(value: unknown): {
  message: string | null;
  code: string | null;
} {
  if (typeof value === 'string') {
    return { message: toStringOrNull(value), code: null };
  }

  const record = asRecord(value);
  if (!record) return { message: null, code: null };

  const nestedError = asRecord(record.error);
  const message =
    toStringOrNull(record.message ?? record.detail ?? record.errorMessage) ??
    (nestedError
      ? toStringOrNull(
          nestedError.message ?? nestedError.detail ?? nestedError.error,
        )
      : null);

  const code =
    toStringOrNull(record.code ?? record.errorCode) ??
    (nestedError
      ? toStringOrNull(nestedError.code ?? nestedError.errorCode)
      : null);

  return { message, code };
}

function normalizeGenerationJob(raw: unknown): SimulationGenerationJob | null {
  const record = asRecord(raw);
  if (!record) return null;

  const jobId = toNonEmptyString(record.jobId ?? record.job_id ?? record.id);
  const status =
    toStringOrNull(record.status ?? record.state)?.toLowerCase() ?? null;
  const pollAfterMs = toNumberOrNull(
    record.pollAfterMs ?? record.poll_after_ms,
  );

  const directErrorMessage = toStringOrNull(
    record.errorMessage ?? record.error_message ?? record.lastError,
  );
  const directErrorCode = toStringOrNull(record.errorCode ?? record.error_code);
  const nestedError = readErrorInfo(record.error ?? record.last_error);

  const errorMessage =
    directErrorMessage ?? nestedError.message ?? toStringOrNull(record.error);
  const errorCode = directErrorCode ?? nestedError.code;

  if (!jobId && !status && pollAfterMs == null && !errorMessage && !errorCode) {
    return null;
  }

  return {
    jobId,
    status,
    pollAfterMs: pollAfterMs != null && pollAfterMs >= 0 ? pollAfterMs : null,
    errorMessage,
    errorCode,
  };
}

function normalizeScenarioVersion(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): SimulationScenarioVersion {
  const summary = asRecord(
    raw.scenarioVersionSummary ??
      raw.scenario_version_summary ??
      raw.scenarioVersion,
  );

  const id =
    toNonEmptyString(
      scenario?.id ??
        scenario?.scenarioId ??
        scenario?.scenario_id ??
        summary?.id ??
        summary?.scenarioId ??
        summary?.scenario_id ??
        raw.scenarioId ??
        raw.scenario_id,
    ) ?? null;

  const versionIndex =
    parseVersionIndex(
      scenario?.versionIndex ??
        scenario?.version_index ??
        scenario?.version ??
        summary?.versionIndex ??
        summary?.version_index ??
        summary?.version ??
        raw.versionIndex ??
        raw.version_index ??
        raw.version,
    ) ?? null;

  const status =
    toStringOrNull(
      scenario?.status ??
        summary?.status ??
        raw.scenarioStatus ??
        raw.scenario_status,
    )?.toLowerCase() ?? null;

  const lockedAt =
    toStringOrNull(
      scenario?.lockedAt ??
        scenario?.locked_at ??
        summary?.lockedAt ??
        summary?.locked_at ??
        raw.lockedAt ??
        raw.locked_at,
    ) ?? null;

  return {
    id,
    versionIndex,
    status,
    lockedAt,
    isLocked: Boolean(lockedAt),
  };
}

function isFailureStatus(value: string | null | undefined): boolean {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? '';
  if (!normalized) return false;
  return (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('dead_letter') ||
    normalized.includes('cancel')
  );
}

function isGeneratingStatus(value: string | null | undefined): boolean {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? '';
  return (
    normalized === 'generating' ||
    normalized === 'queued' ||
    normalized === 'running'
  );
}

function readGenerationJob(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): SimulationGenerationJob | null {
  const explicitJob =
    normalizeGenerationJob(raw.scenarioJob ?? raw.scenario_job) ??
    normalizeGenerationJob(raw.generationJob ?? raw.generation_job) ??
    normalizeGenerationJob(raw.job) ??
    normalizeGenerationJob(scenario?.job ?? scenario?.scenarioJob);

  if (explicitJob) return explicitJob;

  const inferred = normalizeGenerationJob({
    jobId: raw.jobId ?? raw.job_id ?? scenario?.jobId ?? scenario?.job_id,
    status:
      raw.jobStatus ??
      raw.job_status ??
      scenario?.jobStatus ??
      scenario?.job_status,
    pollAfterMs:
      raw.pollAfterMs ??
      raw.poll_after_ms ??
      scenario?.pollAfterMs ??
      scenario?.poll_after_ms,
    error:
      raw.jobError ??
      raw.job_error ??
      scenario?.jobError ??
      scenario?.job_error,
    errorCode:
      raw.jobErrorCode ??
      raw.job_error_code ??
      scenario?.jobErrorCode ??
      scenario?.job_error_code,
  });

  return inferred;
}

export function normalizeSimulationDetailPreview(
  raw: unknown,
): SimulationDetailPreview {
  const plan = normalizeSimulationPlan(raw);
  const record = asRecord(raw) ?? {};
  const scenario = asRecord(record.scenario);
  const statusRaw = toStringOrNull(record.status)?.toLowerCase() ?? null;
  const status = parseLifecycleStatus(statusRaw);
  const scenarioVersion = normalizeScenarioVersion(record, scenario);
  const generationJob = readGenerationJob(record, scenario);

  return {
    plan,
    status,
    statusRaw,
    scenarioVersion,
    storyline: readStoryline(record, scenario, plan),
    rubricSummary: readRubricSummary(record, scenario),
    level:
      toStringOrNull(record.seniority ?? record.level ?? record.roleLevel) ??
      null,
    companyContext: readCompanyContext(
      record.companyContext ?? record.company_context,
    ),
    generationJob,
    hasJobFailure:
      isFailureStatus(generationJob?.status) ||
      isFailureStatus(scenarioVersion.status) ||
      Boolean(generationJob?.errorMessage),
  };
}

export function scenarioVersionLabel(versionIndex: number | null): string {
  if (versionIndex == null || versionIndex < 1) return 'v—';
  return `v${versionIndex}`;
}

export function isPreviewGenerating(
  detail: SimulationDetailPreview | null,
): boolean {
  if (!detail) return false;
  return (
    detail.status === 'generating' ||
    isGeneratingStatus(detail.scenarioVersion.status) ||
    isGeneratingStatus(detail.generationJob?.status)
  );
}

export function isPreviewEmpty(
  detail: SimulationDetailPreview | null,
): boolean {
  if (!detail) return true;
  const hasStoryline = Boolean(detail.storyline?.trim());
  const hasRubricSummary = Boolean(detail.rubricSummary?.trim());
  const hasTasks = Boolean(detail.plan?.days?.length);
  return !hasStoryline && !hasRubricSummary && !hasTasks;
}
