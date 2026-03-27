import { toStringOrCsv, toStringOrNull } from '../parsingUtils';
import type { SimulationPlan } from '../plan';
export { readRubricSummary } from './contentRubricSummaryUtils';

export function readCompanyContext(value: unknown): string | null {
  const asString = toStringOrCsv(value);
  if (asString) return asString;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
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

export function readStoryline(
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
  if (!scenario) return plan?.scenario ?? null;
  return (
    toStringOrNull(
      scenario.storyline ??
        scenario.storylineMd ??
        scenario.storyline_md ??
        scenario.prestart ??
        scenario.preStart ??
        scenario.pre_start ??
        scenario.summary ??
        scenario.overview ??
        scenario.description,
    ) ??
    plan?.scenario ??
    null
  );
}

export function readTaskPromptsJson(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): unknown {
  const source =
    scenario?.taskPromptsJson ??
    scenario?.task_prompts_json ??
    raw.taskPromptsJson ??
    raw.task_prompts_json;
  return source === undefined ? null : source;
}

export function readRubricJson(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): unknown {
  const source =
    scenario?.rubricJson ??
    scenario?.rubric_json ??
    raw.rubricJson ??
    raw.rubric_json;
  return source === undefined ? null : source;
}

export function readNotes(
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
