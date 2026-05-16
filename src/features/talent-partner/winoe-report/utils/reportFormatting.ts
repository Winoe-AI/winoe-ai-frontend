function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeScoreOutOf100(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= 1) return clamp(value * 100, 0, 100);
  if (value <= 100) return value;
  return 100;
}

export function normalizeScoreOutOf10(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value <= 1) return clamp(value * 10, 0, 10);
  if (value <= 10) return value;
  if (value <= 100) return clamp(value / 10, 0, 10);
  return 10;
}

function formatDisplayNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? String(Math.round(rounded))
    : String(rounded);
}

export function formatScorePercent(value: number): string {
  return `${Math.round(normalizeScoreOutOf100(value))}%`;
}

export function formatScoreOutOf100(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${formatDisplayNumber(normalizeScoreOutOf100(value))} / 100`;
}

export function formatWinoeScore(value: number): string {
  return formatDisplayNumber(normalizeScoreOutOf100(value));
}

export function formatDimensionScore(value: number): string {
  return `${formatDisplayNumber(normalizeScoreOutOf10(value))}/10`;
}

export function formatCountLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function formatStatusLabel(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRecommendationEvidenceLanguage(
  value: string | null | undefined,
): string {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (
    normalized === 'hire' ||
    normalized === 'strong_hire' ||
    normalized === 'recommended' ||
    normalized === 'proceed'
  ) {
    return 'Evidence suggests strong alignment with this Trial.';
  }
  if (normalized === 'lean_hire') {
    return 'Evidence shows meaningful strengths.';
  }
  if (normalized === 'mixed' || normalized === 'needs_review') {
    return 'Evidence is mixed; review the linked artifacts.';
  }
  if (
    normalized === 'reject' ||
    normalized === 'no_hire' ||
    normalized === 'do_not_proceed'
  ) {
    return 'Evidence shows material concerns to review.';
  }
  return 'Evidence is mixed; review the linked artifacts.';
}

export function formatTranscriptTime(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatGeneratedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatCalibrationText(
  calibrationText: string | null,
  confidence: number | null,
  dayCount: number,
): string {
  if (calibrationText && calibrationText.trim().length > 0)
    return calibrationText;
  if (confidence !== null && Number.isFinite(confidence)) {
    return `Confidence ${formatScorePercent(confidence)} based on rubric-aligned evidence across ${dayCount} scored day${dayCount === 1 ? '' : 's'}.`;
  }
  return `Recommendation calibrated using rubric-aligned evidence across ${dayCount} scored day${dayCount === 1 ? '' : 's'}.`;
}

export function formatNarrativeSummary(
  overallWinoeScore: number,
  calibrationText: string | null,
  recommendation: string | null,
  dimensionCount: number,
): string {
  if (calibrationText && calibrationText.trim().length > 0) {
    return calibrationText;
  }

  const recommendationLanguage =
    formatRecommendationEvidenceLanguage(recommendation);
  if (
    recommendationLanguage ===
      'Evidence suggests strong alignment with this Trial.' ||
    normalizeScoreOutOf100(overallWinoeScore) >= 85
  ) {
    return `Evidence suggests strong alignment with this Trial's engineering demands. Winoe found ${dimensionCount} linked dimension${dimensionCount === 1 ? '' : 's'} with supporting artifacts, but the Talent Partner should still inspect the Evidence Trail before deciding.`;
  }
  if (
    recommendationLanguage === 'Evidence shows meaningful strengths.' ||
    normalizeScoreOutOf100(overallWinoeScore) >= 65
  ) {
    return `Evidence shows meaningful strengths, with a few areas worth follow-up. Winoe found ${dimensionCount} linked dimension${dimensionCount === 1 ? '' : 's'} and encourages the Talent Partner to inspect the underlying artifacts before deciding.`;
  }
  return `The Evidence Trail is mixed; review the concerns below before deciding. Winoe found ${dimensionCount} linked dimension${dimensionCount === 1 ? '' : 's'} and surfaces the supporting artifacts directly.`;
}

export function formatSummaryTone(
  score: number,
): 'strong' | 'steady' | 'mixed' | 'thin' {
  const normalized = normalizeScoreOutOf100(score);
  if (normalized >= 85) return 'strong';
  if (normalized >= 65) return 'steady';
  if (normalized >= 45) return 'mixed';
  return 'thin';
}
