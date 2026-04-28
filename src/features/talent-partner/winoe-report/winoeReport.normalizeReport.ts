import type {
  WinoeReportDayScore,
  WinoeReportDimension,
  WinoeReportEvidence,
  WinoeReportReviewerSummary,
  WinoeReportReport,
  WinoeReportVersion,
} from './winoeReport.types';
import {
  asRecord,
  toNullableString,
  toPositiveIntList,
  toStringList,
  toUnitInterval,
  toNumberOrNull,
  toUnitIntervalOrNull,
} from './winoeReport.normalize.base';
import { normalizeDayScore } from './winoeReport.normalizeDayScore';
import { normalizeEvidence } from './winoeReport.normalizeEvidence';
import { normalizeWarnings } from './winoeReport.normalizeWarnings';
import {
  formatDayLabel,
  getDimensionCatalog,
  getDimensionDefinition,
  humanizeKey,
} from './winoeReport.catalog';

type DimensionDefinition = ReturnType<typeof getDimensionCatalog>[number];

const DIMENSION_ARRAY_KEYS = [
  'dimensionScores',
  'dimension_scores',
  'dimensions',
  'subScores',
  'sub_scores',
  'rubricDimensions',
  'rubric_dimensions',
];

const REVIEWER_ARRAY_KEYS = [
  'reviewerSummaries',
  'reviewer_summaries',
  'subAgentReports',
  'sub_agent_reports',
  'reviewerReports',
  'reviewer_reports',
];

function getRecordArray(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown>[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }
  return [];
}

function getEvidenceArray(
  record: Record<string, unknown>,
): WinoeReportEvidence[] {
  const raw =
    (Array.isArray(record.evidence) ? record.evidence : null) ??
    (Array.isArray(record.evidenceItems) ? record.evidenceItems : null) ??
    (Array.isArray(record.evidence_items) ? record.evidence_items : null) ??
    (Array.isArray(record.artifacts) ? record.artifacts : null) ??
    (Array.isArray(record.linkedArtifacts) ? record.linkedArtifacts : null) ??
    (Array.isArray(record.linked_artifacts) ? record.linked_artifacts : null) ??
    [];
  return raw
    .map(normalizeEvidence)
    .filter((item): item is WinoeReportEvidence => Boolean(item));
}

function uniqueEvidenceCount(evidence: WinoeReportEvidence[]): number {
  const seen = new Set<string>();
  evidence.forEach((item) => {
    const key =
      item.ref ??
      item.url ??
      item.anchor ??
      `${item.kind}-${item.dayIndex ?? 'x'}-${item.startMs ?? 'x'}`;
    seen.add(key);
  });
  return seen.size;
}

function chooseString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = toNullableString(value);
    if (text) return text;
  }
  return null;
}

function normalizePositiveIntList(value: unknown): number[] {
  if (Array.isArray(value)) return toPositiveIntList(value);
  const numeric = toNumberOrNull(value);
  return numeric === null || numeric <= 0 ? [] : [Math.round(numeric)];
}

function dimensionOrderIndex(key: string): number {
  const index = getDimensionCatalog().findIndex((item) => item.key === key);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

function sortDimensionsByCatalogOrder(
  a: WinoeReportDimension,
  b: WinoeReportDimension,
): number {
  const orderA = dimensionOrderIndex(a.key);
  const orderB = dimensionOrderIndex(b.key);
  if (orderA !== orderB) return orderA - orderB;
  return a.label.localeCompare(b.label);
}

function collectDimensionKeys(record: Record<string, unknown>): string[] {
  return toStringList([
    record.key,
    record.id,
    record.slug,
    record.dimensionKey,
    record.dimension_key,
    record.dimension,
    record.dimensionLabel,
    record.dimension_label,
    record.rubricKey,
    record.rubric_key,
    record.category,
    record.name,
    record.label,
  ]);
}

function collectDimensionEvidence(
  key: string,
  label: string,
  dayScores: WinoeReportDayScore[],
): WinoeReportEvidence[] {
  return dayScores.flatMap((day) =>
    day.evidence.filter((item) => {
      const dimensionKey =
        item.dimensionKey ?? item.dimensionLabel ?? item.sourceLabel;
      if (!dimensionKey) return false;
      const definition = getDimensionDefinition(dimensionKey);
      return Boolean(
        definition?.key === key ||
        definition?.label === label ||
        dimensionKey === key ||
        dimensionKey === label,
      );
    }),
  );
}

function collectDimensionScoreSamples(
  key: string,
  label: string,
  dayScores: WinoeReportDayScore[],
): number[] {
  return dayScores
    .flatMap((day) =>
      Object.entries(day.rubricBreakdown)
        .filter(([entryKey]) => {
          const dimension = getDimensionDefinition(entryKey);
          return Boolean(
            dimension?.key === key ||
            dimension?.label === label ||
            entryKey === key ||
            humanizeKey(entryKey) === label,
          );
        })
        .map(([, value]) => toUnitIntervalOrNull(value))
        .filter((value): value is number => value !== null),
    )
    .filter((value): value is number => value !== null);
}

function mergeEvidenceItems(
  primary: WinoeReportEvidence[],
  secondary: WinoeReportEvidence[],
): WinoeReportEvidence[] {
  return Array.from(
    new Map(
      [...primary, ...secondary].map((item) => [
        item.ref ??
          item.url ??
          item.anchor ??
          `${item.kind}-${item.dayIndex ?? 'x'}-${item.startMs ?? 'x'}`,
        item,
      ]),
    ).values(),
  );
}

function buildDimensionFromParts({
  key,
  label,
  description,
  sourceKeys,
  score,
  summary,
  evidence,
}: {
  key: string;
  label: string;
  description: string | null;
  sourceKeys: string[];
  score: number | null;
  summary: string | null;
  evidence: WinoeReportEvidence[];
}): WinoeReportDimension {
  const mergedEvidence = mergeEvidenceItems([], evidence);
  return {
    key,
    label,
    score,
    summary,
    evidence: mergedEvidence,
    evidenceCount: mergedEvidence.length,
    linkedArtifactCount: uniqueEvidenceCount(mergedEvidence),
    sourceKeys: Array.from(new Set(sourceKeys)),
    emptyStateMessage:
      mergedEvidence.length === 0
        ? 'No linked artifacts were returned for this dimension yet.'
        : null,
    description,
  };
}

function buildExplicitDimension(
  record: Record<string, unknown>,
  dayScores: WinoeReportDayScore[],
): WinoeReportDimension | null {
  const rawLabel = chooseString(
    record.label,
    record.title,
    record.name,
    record.dimensionLabel,
    record.dimension_label,
    record.dimension,
    record.key,
  );
  const definition = getDimensionDefinition(rawLabel);
  const sourceKeys = Array.from(
    new Set(
      collectDimensionKeys(record).map((value) => {
        const normalized = getDimensionDefinition(value);
        return normalized?.key ?? value;
      }),
    ),
  );
  const key =
    definition?.key ?? sourceKeys[0] ?? humanizeKey(rawLabel ?? 'dimension');
  const label = definition?.label ?? rawLabel ?? humanizeKey(key);
  const explicitScore = toUnitIntervalOrNull(
    record.score ??
      record.value ??
      record.points ??
      record.total ??
      record.scoreValue ??
      record.score_value,
  );
  const explanation = chooseString(
    record.summary,
    record.explanation,
    record.description,
    record.notes,
    record.detail,
  );
  const evidence = getEvidenceArray(record);
  const matchingDayEvidence = collectDimensionEvidence(key, label, dayScores);
  const mergedEvidence = mergeEvidenceItems(evidence, matchingDayEvidence);
  const scoreSamples = collectDimensionScoreSamples(key, label, dayScores);

  return buildDimensionFromParts({
    key,
    label,
    description: definition?.description ?? null,
    sourceKeys,
    score:
      explicitScore ??
      (scoreSamples.length > 0
        ? scoreSamples.reduce((sum, value) => sum + value, 0) /
          scoreSamples.length
        : null),
    summary:
      explanation ??
      (mergedEvidence.length > 0
        ? `${mergedEvidence.length} linked artifact${mergedEvidence.length === 1 ? '' : 's'} captured for this dimension.`
        : null),
    evidence: mergedEvidence,
  });
}

function buildCanonicalDimension(
  definition: DimensionDefinition,
  dayScores: WinoeReportDayScore[],
  explicitDimension: WinoeReportDimension | null,
): WinoeReportDimension {
  if (explicitDimension) return explicitDimension;

  const evidence = collectDimensionEvidence(
    definition.key,
    definition.label,
    dayScores,
  );
  const scoreSamples = collectDimensionScoreSamples(
    definition.key,
    definition.label,
    dayScores,
  );
  const derivedScore =
    scoreSamples.length > 0
      ? scoreSamples.reduce((sum, value) => sum + value, 0) /
        scoreSamples.length
      : null;

  return buildDimensionFromParts({
    key: definition.key,
    label: definition.label,
    description: definition.description,
    sourceKeys: [definition.key, ...definition.aliases],
    score: derivedScore,
    summary:
      derivedScore !== null
        ? `${definition.description} Evidence was found in ${evidence.length} linked artifact${evidence.length === 1 ? '' : 's'}.`
        : null,
    evidence,
  });
}

function buildDerivedExtraDimension(
  key: string,
  dayScores: WinoeReportDayScore[],
  explicitKeySet: Set<string>,
  canonicalKeySet: Set<string>,
): WinoeReportDimension | null {
  if (explicitKeySet.has(key) || canonicalKeySet.has(key)) return null;
  const definition = getDimensionDefinition(key);
  const label = definition?.label ?? humanizeKey(key);
  const evidence = collectDimensionEvidence(key, label, dayScores);
  const scoreSamples = collectDimensionScoreSamples(key, label, dayScores);
  const score =
    scoreSamples.length > 0
      ? scoreSamples.reduce((sum, value) => sum + value, 0) /
        scoreSamples.length
      : null;
  if (score === null && evidence.length === 0) return null;

  return buildDimensionFromParts({
    key: definition?.key ?? key,
    label,
    description: definition?.description ?? null,
    sourceKeys: [key],
    score,
    summary:
      score !== null
        ? `Derived from day-level rubric and evidence signals. Evidence was found in ${evidence.length} linked artifact${evidence.length === 1 ? '' : 's'}.`
        : null,
    evidence,
  });
}

function buildDimensions(
  record: Record<string, unknown>,
  dayScores: WinoeReportDayScore[],
): WinoeReportDimension[] {
  const dimensionRecords = getRecordArray(record, DIMENSION_ARRAY_KEYS);
  const explicitDimensions = dimensionRecords
    .map((item) => buildExplicitDimension(item, dayScores))
    .filter((item): item is WinoeReportDimension => Boolean(item));
  const explicitByKey = new Map(
    explicitDimensions.map((item) => [item.key, item]),
  );
  const canonicalDefinitions = getDimensionCatalog();
  const canonicalKeySet = new Set(canonicalDefinitions.map((item) => item.key));
  const canonicalDimensions = canonicalDefinitions.map((definition) =>
    buildCanonicalDimension(
      definition,
      dayScores,
      explicitByKey.get(definition.key) ?? null,
    ),
  );

  const explicitExtraDimensions = explicitDimensions
    .filter((item) => !canonicalKeySet.has(item.key))
    .sort(sortDimensionsByCatalogOrder);

  const derivedExtraKeys = Array.from(
    new Set(
      dayScores.flatMap((day) => [
        ...Object.keys(day.rubricBreakdown).map(
          (value) => getDimensionDefinition(value)?.key ?? value,
        ),
        ...day.evidence
          .map(
            (item) =>
              item.dimensionKey ?? item.dimensionLabel ?? item.sourceLabel,
          )
          .filter((value): value is string => Boolean(value))
          .map((value) => getDimensionDefinition(value)?.key ?? value),
      ]),
    ),
  );
  const derivedExtraDimensions = derivedExtraKeys
    .map((key) =>
      buildDerivedExtraDimension(
        key,
        dayScores,
        new Set(explicitDimensions.map((item) => item.key)),
        canonicalKeySet,
      ),
    )
    .filter((item): item is WinoeReportDimension => Boolean(item))
    .sort(sortDimensionsByCatalogOrder);

  return [
    ...canonicalDimensions,
    ...explicitExtraDimensions,
    ...derivedExtraDimensions,
  ];
}

function buildReviewerSummaries(
  record: Record<string, unknown>,
  dayScores: WinoeReportDayScore[],
): WinoeReportReviewerSummary[] {
  const reviewerRecords = getRecordArray(record, REVIEWER_ARRAY_KEYS);
  const summaries: WinoeReportReviewerSummary[] = reviewerRecords
    .map((item): WinoeReportReviewerSummary | null => {
      const reviewerName = chooseString(
        item.reviewerName,
        item.reviewer_name,
        item.name,
        item.title,
        item.label,
      );
      if (!reviewerName) return null;
      const dayIndexes = Array.from(
        new Set([
          ...normalizePositiveIntList(item.dayIndexes),
          ...normalizePositiveIntList(item.day_indexes),
          ...normalizePositiveIntList(item.days),
          ...normalizePositiveIntList(item.day),
          ...normalizePositiveIntList(item.dayIndex),
          ...normalizePositiveIntList(item.day_index),
        ]),
      );
      const evidence = getEvidenceArray(item);
      return {
        reviewerName,
        dayIndexes,
        score: toUnitIntervalOrNull(
          item.score ?? item.value ?? item.overallScore ?? item.overall_score,
        ),
        summary: chooseString(
          item.summary,
          item.explanation,
          item.description,
          item.notes,
          item.result,
        ),
        strengths: toStringList(
          item.strengths ?? item.keyStrengths ?? item.key_strengths,
        ),
        concerns: toStringList(item.concerns ?? item.risks ?? item.keyRisks),
        evidence,
        sourceLabel: chooseString(item.sourceLabel, item.source_label),
      };
    })
    .filter((item): item is WinoeReportReviewerSummary => Boolean(item));

  if (summaries.length > 0) {
    return summaries;
  }

  const dayBasedSummaries = dayScores
    .map((day): WinoeReportReviewerSummary | null => {
      const summary = day.reviewerSummary ?? day.summary ?? null;
      const reviewerName = `${day.dayLabel ?? formatDayLabel(day.dayIndex)} reviewer`;
      if (!summary && day.evidence.length === 0) return null;
      return {
        reviewerName,
        dayIndexes: [day.dayIndex],
        score: day.score,
        summary,
        strengths: [],
        concerns: [],
        evidence: day.evidence,
        sourceLabel: day.dayLabel ?? formatDayLabel(day.dayIndex),
      };
    })
    .filter((item): item is WinoeReportReviewerSummary => Boolean(item));

  const synthesis = chooseString(
    record.narrativeAssessment,
    record.narrative_assessment,
    record.summary,
    record.personaVoice,
    record.persona_voice,
  );

  if (synthesis) {
    dayBasedSummaries.unshift({
      reviewerName: 'Winoe synthesis',
      dayIndexes: dayScores.map((day) => day.dayIndex),
      score: toUnitIntervalOrNull(
        record.overallWinoeScore ?? record.overall_winoe_score,
      ),
      summary: synthesis,
      strengths: [],
      concerns: [],
      evidence: [],
      sourceLabel: 'Winoe synthesis',
    });
  }

  return dayBasedSummaries;
}

export function normalizeVersion(value: unknown): WinoeReportVersion | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    model: toNullableString(record.model),
    promptVersion: toNullableString(
      record.promptVersion ?? record.prompt_version,
    ),
    rubricVersion: toNullableString(
      record.rubricVersion ?? record.rubric_version,
    ),
    modelVersion: toNullableString(record.modelVersion ?? record.model_version),
  };
}

export function normalizeReport(value: unknown): WinoeReportReport | null {
  const record = asRecord(value);
  if (!record) return null;
  const dayScoresRaw =
    (Array.isArray(record.dayScores) ? record.dayScores : null) ??
    (Array.isArray(record.day_scores) ? record.day_scores : []);
  const disabledDayIndexes = toPositiveIntList(
    record.disabledDayIndexes ?? record.disabled_day_indexes,
  );
  const disabledDaySet = new Set(disabledDayIndexes);
  const dayScores = dayScoresRaw
    .map((item) => normalizeDayScore(item, disabledDaySet))
    .filter((item): item is WinoeReportDayScore => Boolean(item));

  const existingDayIndexes = new Set(dayScores.map((item) => item.dayIndex));
  disabledDayIndexes.forEach((dayIndex) => {
    if (existingDayIndexes.has(dayIndex)) return;
    dayScores.push({
      dayIndex,
      score: null,
      rubricBreakdown: {},
      evidence: [],
      evaluationStatus: 'not_evaluated',
      reason: 'ai_eval_disabled_for_day',
      aiEvaluationEnabled: false,
    });
  });
  dayScores.sort((a, b) => a.dayIndex - b.dayIndex);
  const dimensionScores = buildDimensions(record, dayScores);
  const reviewerSummaries = buildReviewerSummaries(record, dayScores);
  const narrativeAssessment = chooseString(
    record.narrativeAssessment,
    record.narrative_assessment,
    record.summary,
    record.personaVoice,
    record.persona_voice,
    record.assessment,
    record.assessmentText,
    record.assessment_text,
  );
  const personaVoice = chooseString(
    record.personaVoice,
    record.persona_voice,
    record.winoeVoice,
    record.winoe_voice,
  );

  return {
    overallWinoeScore: toUnitInterval(
      record.overallWinoeScore ?? record.overall_winoe_score,
    ),
    recommendation: toNullableString(record.recommendation) ?? 'lean_hire',
    confidence: toNumberOrNull(record.confidence),
    calibrationText:
      toNullableString(
        record.calibrationText ??
          record.calibration_text ??
          record.calibrationLanguage ??
          record.calibration_language,
      ) ?? null,
    narrativeAssessment,
    personaVoice,
    summary: chooseString(
      record.summary,
      record.reportSummary,
      record.report_summary,
    ),
    dimensionScores,
    reviewerSummaries,
    dayScores,
    disabledDayIndexes,
    version: normalizeVersion(record.version),
    warnings: normalizeWarnings(null, record),
  };
}
