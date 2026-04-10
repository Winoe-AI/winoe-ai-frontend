import { toStringOrCsv, toStringOrNull } from '../parsingUtils';
import { extractDayTasks } from './extractDayTasksUtils';
import type { TrialPlan } from './typesUtils';

export function normalizeTrialPlan(raw: unknown): TrialPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const scenarioRaw =
    rec.scenario ??
    rec.scenarioSummary ??
    rec.scenario_summary ??
    rec.overview ??
    rec.summary ??
    rec.trialScenario ??
    rec.trial_scenario;

  const scenario =
    toStringOrNull(scenarioRaw) ??
    (scenarioRaw && typeof scenarioRaw === 'object'
      ? toStringOrNull(
          (scenarioRaw as Record<string, unknown>).summary ??
            (scenarioRaw as Record<string, unknown>).overview ??
            (scenarioRaw as Record<string, unknown>).description,
        )
      : null);

  return {
    title: toStringOrNull(rec.title ?? rec.trial_title ?? rec.name),
    templateKey: toStringOrNull(rec.templateKey ?? rec.template_key),
    role: toStringOrCsv(rec.role ?? rec.role_name ?? rec.roleName),
    techStack: toStringOrCsv(
      rec.techStack ?? rec.tech_stack ?? rec.stack ?? rec.stack_name,
    ),
    focus: toStringOrCsv(rec.focus ?? rec.focus_area ?? rec.focusArea),
    scenario,
    days: extractDayTasks(rec).sort((a, b) => a.dayIndex - b.dayIndex),
  };
}
