import { isGeneratingStatus } from './parsersUtils';
import type { TrialDetailPreview } from './typesUtils';

export function scenarioVersionLabel(versionIndex: number | null): string {
  if (versionIndex == null || versionIndex < 1) return 'v—';
  return `v${versionIndex}`;
}

export function isPreviewGenerating(
  detail: TrialDetailPreview | null,
): boolean {
  if (!detail) return false;
  return (
    detail.status === 'generating' ||
    isGeneratingStatus(detail.scenarioVersion.status) ||
    isGeneratingStatus(detail.generationJob?.status)
  );
}

export function isPreviewEmpty(detail: TrialDetailPreview | null): boolean {
  if (!detail) return true;
  const hasStoryline = Boolean(detail.storyline?.trim());
  const hasRubricSummary = Boolean(detail.rubricSummary?.trim());
  const hasTasks = Boolean(detail.plan?.days?.length);
  return !hasStoryline && !hasRubricSummary && !hasTasks;
}
