import type { WinoeReportEvidence } from './winoeReport.types';
import {
  asRecord,
  normalizeStatus,
  toNullableString,
  toNumberOrNull,
} from './winoeReport.normalize.base';
import {
  formatDayLabel,
  formatEvidenceKindLabel,
  getDimensionDefinition,
} from './winoeReport.catalog';

export function normalizeEvidence(value: unknown): WinoeReportEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  const kind =
    toNullableString(
      record.kind ??
        record.type ??
        record.artifactType ??
        record.artifact_type ??
        record.label ??
        record.title,
    ) ?? 'evidence';
  const startMs = toNumberOrNull(record.startMs ?? record.start_ms);
  const endMs = toNumberOrNull(record.endMs ?? record.end_ms);
  const dayIndex = toNumberOrNull(
    record.dayIndex ??
      record.day_index ??
      record.sourceDay ??
      record.source_day,
  );
  const normalizedDayIndex =
    dayIndex === null ? null : Math.max(0, Math.round(dayIndex));
  const dimensionValue =
    toNullableString(
      record.dimensionKey ??
        record.dimension_key ??
        record.dimension ??
        record.rubricKey ??
        record.rubric_key ??
        record.category,
    ) ?? null;
  const dimensionDefinition = getDimensionDefinition(dimensionValue);
  const sourceLabel =
    toNullableString(
      record.sourceLabel ??
        record.source_label ??
        record.source ??
        record.origin ??
        record.dayLabel ??
        record.day_label,
    ) ?? null;
  const dayLabel =
    sourceLabel ??
    (normalizedDayIndex === null ? null : formatDayLabel(normalizedDayIndex));
  return {
    kind,
    label:
      toNullableString(
        record.label ?? record.title ?? record.name ?? record.summary,
      ) ?? formatEvidenceKindLabel(kind),
    title: toNullableString(record.title ?? record.name),
    description:
      toNullableString(
        record.description ?? record.detail ?? record.details ?? record.note,
      ) ?? null,
    ref: toNullableString(record.ref),
    url: toNullableString(record.url),
    excerpt: toNullableString(record.excerpt),
    startMs: startMs === null ? null : Math.max(0, Math.round(startMs)),
    endMs: endMs === null ? null : Math.max(0, Math.round(endMs)),
    dayIndex: normalizedDayIndex,
    dayLabel,
    sourceDay: normalizedDayIndex,
    sourceType: normalizeStatus(record.sourceType ?? record.source_type),
    sourceLabel,
    dimensionKey: dimensionDefinition?.key ?? dimensionValue,
    dimensionLabel: dimensionDefinition?.label ?? dimensionValue,
    anchor: toNullableString(record.anchor ?? record.fragment ?? record.hash),
  };
}
