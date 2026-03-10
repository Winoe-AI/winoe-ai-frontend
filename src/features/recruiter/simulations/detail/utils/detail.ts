import { toNumberOrNull, toStringOrCsv, toStringOrNull } from './parsing';
import { normalizeSimulationPlan, type SimulationPlan } from './plan';

export type SimulationLifecycleStatus =
  | 'draft'
  | 'generating'
  | 'ready_for_review'
  | 'active_inviting'
  | 'terminated';

export type ScenarioContentAvailability =
  | 'canonical'
  | 'local_only'
  | 'unavailable';

export type SimulationScenarioVersion = {
  id: string | null;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  isLocked: boolean;
  contentAvailability: ScenarioContentAvailability;
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
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  scenarioVersions: SimulationScenarioVersion[];
  scenarioVersion: SimulationScenarioVersion;
  storyline: string | null;
  taskPromptsJson: unknown;
  rubricJson: unknown;
  notes: string | null;
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

function parseContentAvailability(
  value: unknown,
): ScenarioContentAvailability | null {
  const normalized = toStringOrNull(value)?.toLowerCase() ?? null;
  if (
    normalized === 'canonical' ||
    normalized === 'local_only' ||
    normalized === 'unavailable'
  ) {
    return normalized;
  }
  return null;
}

function hasCanonicalScenarioContent(
  record: Record<string, unknown> | null,
): boolean {
  if (!record) return false;
  return (
    Object.prototype.hasOwnProperty.call(record, 'storylineMd') ||
    Object.prototype.hasOwnProperty.call(record, 'storyline_md') ||
    Object.prototype.hasOwnProperty.call(record, 'storyline') ||
    Object.prototype.hasOwnProperty.call(record, 'taskPromptsJson') ||
    Object.prototype.hasOwnProperty.call(record, 'task_prompts_json') ||
    Object.prototype.hasOwnProperty.call(record, 'taskPrompts') ||
    Object.prototype.hasOwnProperty.call(record, 'rubricJson') ||
    Object.prototype.hasOwnProperty.call(record, 'rubric_json') ||
    Object.prototype.hasOwnProperty.call(record, 'rubric')
  );
}

function mergeContentAvailability(
  left: ScenarioContentAvailability,
  right: ScenarioContentAvailability,
): ScenarioContentAvailability {
  const rank: Record<ScenarioContentAvailability, number> = {
    unavailable: 0,
    local_only: 1,
    canonical: 2,
  };
  return rank[left] >= rank[right] ? left : right;
}

function normalizeScenarioVersionRecord(
  record: Record<string, unknown> | null,
  fallback?: { id?: string | null; versionIndex?: number | null },
): SimulationScenarioVersion {
  const id =
    toNonEmptyString(
      record?.id ??
        record?.scenarioVersionId ??
        record?.scenario_version_id ??
        fallback?.id,
    ) ?? null;

  const versionIndex =
    parseVersionIndex(
      record?.versionIndex ??
        record?.version_index ??
        record?.version ??
        fallback?.versionIndex,
    ) ?? null;

  const status = toStringOrNull(record?.status)?.toLowerCase() ?? null;
  const lockedAt =
    toStringOrNull(record?.lockedAt ?? record?.locked_at) ?? null;
  const contentAvailability =
    parseContentAvailability(
      record?.contentAvailability ?? record?.content_availability,
    ) ?? (hasCanonicalScenarioContent(record) ? 'canonical' : 'unavailable');

  return {
    id,
    versionIndex,
    status,
    lockedAt,
    isLocked: Boolean(lockedAt) || status === 'locked',
    contentAvailability,
  };
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
      raw.storylineMd ??
      raw.storyline_md ??
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
        scenario.storylineMd ??
        scenario.storyline_md ??
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

function readTaskPromptsJson(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): unknown {
  const source =
    scenario?.taskPromptsJson ??
    scenario?.task_prompts_json ??
    raw.taskPromptsJson ??
    raw.task_prompts_json;

  if (source === undefined) return null;
  return source;
}

function readRubricJson(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): unknown {
  const source =
    scenario?.rubricJson ??
    scenario?.rubric_json ??
    raw.rubricJson ??
    raw.rubric_json;

  if (source === undefined) return null;
  return source;
}

function readNotes(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): string | null {
  return (
    toStringOrNull(
      scenario?.notes ??
        scenario?.focusNotes ??
        scenario?.focus_notes ??
        raw.notes ??
        raw.focusNotes ??
        raw.focus_notes,
    ) ?? null
  );
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
  activeScenarioVersionId: string | null,
): SimulationScenarioVersion {
  const summary = asRecord(
    raw.scenarioVersionSummary ??
      raw.scenario_version_summary ??
      raw.scenarioVersion,
  );

  const idFallback =
    toNonEmptyString(
      summary?.id ??
        summary?.scenarioId ??
        summary?.scenario_id ??
        raw.scenarioId ??
        raw.scenario_id,
    ) ?? activeScenarioVersionId;

  const versionIndexFallback =
    parseVersionIndex(
      summary?.versionIndex ??
        summary?.version_index ??
        summary?.version ??
        raw.versionIndex ??
        raw.version_index ??
        raw.version,
    ) ?? null;

  const source = {
    ...(summary ?? {}),
    ...(scenario ?? {}),
  };

  const normalized = normalizeScenarioVersionRecord(source, {
    id: idFallback,
    versionIndex: versionIndexFallback,
  });
  if (scenario) {
    return {
      ...normalized,
      contentAvailability: 'canonical',
    };
  }
  return normalized;
}

function mergeScenarioVersions(
  versions: SimulationScenarioVersion[],
): SimulationScenarioVersion[] {
  const byId = new Map<string, SimulationScenarioVersion>();

  for (const version of versions) {
    if (!version.id) continue;
    const existing = byId.get(version.id);
    if (!existing) {
      byId.set(version.id, version);
      continue;
    }
    byId.set(version.id, {
      id: version.id,
      versionIndex: version.versionIndex ?? existing.versionIndex,
      status: version.status ?? existing.status,
      lockedAt: version.lockedAt ?? existing.lockedAt,
      isLocked: existing.isLocked || version.isLocked,
      contentAvailability: mergeContentAvailability(
        existing.contentAvailability,
        version.contentAvailability,
      ),
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aIndex = a.versionIndex ?? Number.MAX_SAFE_INTEGER;
    const bIndex = b.versionIndex ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
}

function readScenarioVersionList(
  raw: Record<string, unknown>,
): SimulationScenarioVersion[] {
  const source = raw.scenarioVersions ?? raw.scenario_versions;
  if (!Array.isArray(source)) return [];

  return source
    .map((entry) => normalizeScenarioVersionRecord(asRecord(entry)))
    .filter((entry) => Boolean(entry.id));
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

  const activeScenarioVersionId =
    toNonEmptyString(
      record.activeScenarioVersionId ??
        record.active_scenario_version_id ??
        scenario?.id,
    ) ?? null;

  const pendingScenarioVersionId =
    toNonEmptyString(
      record.pendingScenarioVersionId ?? record.pending_scenario_version_id,
    ) ?? null;

  const scenarioVersion = normalizeScenarioVersion(
    record,
    scenario,
    activeScenarioVersionId,
  );
  const generationJob = readGenerationJob(record, scenario);

  const versions = mergeScenarioVersions([
    ...readScenarioVersionList(record),
    scenarioVersion,
    ...(activeScenarioVersionId &&
    scenarioVersion.id !== activeScenarioVersionId
      ? [
          {
            id: activeScenarioVersionId,
            versionIndex: scenarioVersion.versionIndex,
            status: scenarioVersion.status,
            lockedAt: scenarioVersion.lockedAt,
            isLocked: scenarioVersion.isLocked,
            contentAvailability: scenarioVersion.contentAvailability,
          } satisfies SimulationScenarioVersion,
        ]
      : []),
    ...(pendingScenarioVersionId
      ? [
          {
            id: pendingScenarioVersionId,
            versionIndex: null,
            status: null,
            lockedAt: null,
            isLocked: false,
            contentAvailability: 'unavailable',
          } satisfies SimulationScenarioVersion,
        ]
      : []),
  ]);

  return {
    plan,
    status,
    statusRaw,
    activeScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersions: versions,
    scenarioVersion,
    storyline: readStoryline(record, scenario, plan),
    taskPromptsJson: readTaskPromptsJson(record, scenario),
    rubricJson: readRubricJson(record, scenario),
    notes: readNotes(record, scenario),
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
