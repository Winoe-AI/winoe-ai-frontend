import { toNullableString, toStringList } from './winoeReport.normalize.base';

function includeWarning(target: string[], warning: string | null): void {
  if (!warning) return;
  if (target.includes(warning)) return;
  target.push(warning);
}

export function normalizeWarnings(
  payloadRecord: Record<string, unknown> | null,
  reportRecord: Record<string, unknown> | null,
): string[] {
  const warnings: string[] = [];

  const warningSources = [
    payloadRecord?.warnings,
    payloadRecord?.warning,
    payloadRecord?.warningMessage,
    payloadRecord?.warning_message,
    reportRecord?.warnings,
    reportRecord?.warning,
    reportRecord?.warningMessage,
    reportRecord?.warning_message,
  ];

  warningSources.forEach((value) => {
    if (Array.isArray(value)) {
      toStringList(value).forEach((warning) =>
        includeWarning(warnings, warning),
      );
      return;
    }
    includeWarning(warnings, toNullableString(value));
  });

  const partialFlags = [
    payloadRecord?.partial,
    payloadRecord?.isPartial,
    payloadRecord?.partialArtifactFailure,
    payloadRecord?.partial_artifact_failure,
    reportRecord?.partial,
    reportRecord?.isPartial,
    reportRecord?.partialArtifactFailure,
    reportRecord?.partial_artifact_failure,
  ];

  if (partialFlags.some((item) => item === true)) {
    includeWarning(
      warnings,
      'Some artifacts were unavailable. The report is based on partial evidence.',
    );
  }

  return warnings;
}
