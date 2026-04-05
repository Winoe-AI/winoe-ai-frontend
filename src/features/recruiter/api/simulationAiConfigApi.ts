import { toStringOrNull } from './baseApi';
import { normalizeSimulationEvalEnabledByDay } from './simulationAiEvalApi';
import { isRecord } from './simUtilsApi';
import type {
  SimulationAiConfig,
  SimulationAiScenarioSnapshot,
  SimulationAgentPromptOverride,
  SimulationPromptOverrideKey,
  SimulationPromptOverrides,
} from './typesApi';

export const DEFAULT_SIMULATION_AI_NOTICE_VERSION = 'mvp1';

export const SIMULATION_PROMPT_OVERRIDE_KEYS: readonly SimulationPromptOverrideKey[] =
  ['prestart', 'codespace', 'day1', 'day23', 'day4', 'day5', 'fitProfile'];

const normalizeAgentPromptOverride = (
  value: unknown,
): SimulationAgentPromptOverride | null => {
  if (!isRecord(value)) return null;
  const instructionsMd = toStringOrNull(
    value.instructionsMd ?? value.instructions_md,
  );
  const rubricMd = toStringOrNull(value.rubricMd ?? value.rubric_md);
  if (!instructionsMd && !rubricMd) return null;
  return {
    ...(instructionsMd ? { instructionsMd } : {}),
    ...(rubricMd ? { rubricMd } : {}),
  };
};

const normalizeScenarioSnapshot = (
  value: unknown,
): SimulationAiScenarioSnapshot | null => {
  if (!isRecord(value)) return null;
  const scenarioVersionId = Number(
    value.scenarioVersionId ?? value.scenario_version_id,
  );
  if (!Number.isFinite(scenarioVersionId) || scenarioVersionId <= 0)
    return null;
  const rawAgents = Array.isArray(value.agents) ? value.agents : [];
  const agents = rawAgents.filter(isRecord).map((agent) => ({
    key:
      toStringOrNull(agent.key) ??
      ('unknown' as SimulationPromptOverrideKey | string),
    provider: toStringOrNull(agent.provider) ?? null,
    model: toStringOrNull(agent.model) ?? null,
    runtimeMode:
      toStringOrNull(agent.runtimeMode ?? agent.runtime_mode) ?? null,
    promptVersion:
      toStringOrNull(agent.promptVersion ?? agent.prompt_version) ?? null,
    rubricVersion:
      toStringOrNull(agent.rubricVersion ?? agent.rubric_version) ?? null,
  }));

  return {
    scenarioVersionId,
    snapshotDigest:
      toStringOrNull(value.snapshotDigest ?? value.snapshot_digest) ?? null,
    promptPackVersion:
      toStringOrNull(value.promptPackVersion ?? value.prompt_pack_version) ??
      null,
    bundleStatus:
      toStringOrNull(value.bundleStatus ?? value.bundle_status) ?? null,
    agents: agents.length > 0 ? agents : null,
  };
};

export function normalizeSimulationPromptOverrides(
  value: unknown,
): SimulationPromptOverrides | null {
  if (!isRecord(value)) return null;

  const next: SimulationPromptOverrides = {};
  for (const key of SIMULATION_PROMPT_OVERRIDE_KEYS) {
    const override = normalizeAgentPromptOverride(value[key]);
    if (override) next[key] = override;
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeSimulationAiConfig(
  value: unknown,
): SimulationAiConfig {
  const record = isRecord(value) ? value : {};

  return {
    noticeVersion:
      toStringOrNull(record.noticeVersion ?? record.notice_version) ??
      DEFAULT_SIMULATION_AI_NOTICE_VERSION,
    noticeText:
      toStringOrNull(record.noticeText ?? record.notice_text) ?? undefined,
    evalEnabledByDay: normalizeSimulationEvalEnabledByDay(
      record.evalEnabledByDay ?? record.eval_enabled_by_day,
    ),
    promptOverrides: normalizeSimulationPromptOverrides(
      record.promptOverrides ?? record.prompt_overrides,
    ),
    promptPackVersion:
      toStringOrNull(record.promptPackVersion ?? record.prompt_pack_version) ??
      null,
    changesPendingRegeneration:
      typeof (
        record.changesPendingRegeneration ?? record.changes_pending_regeneration
      ) === 'boolean'
        ? Boolean(
            record.changesPendingRegeneration ??
            record.changes_pending_regeneration,
          )
        : null,
    activeScenarioSnapshot: normalizeScenarioSnapshot(
      record.activeScenarioSnapshot ?? record.active_scenario_snapshot,
    ),
    pendingScenarioSnapshot: normalizeScenarioSnapshot(
      record.pendingScenarioSnapshot ?? record.pending_scenario_snapshot,
    ),
  };
}
