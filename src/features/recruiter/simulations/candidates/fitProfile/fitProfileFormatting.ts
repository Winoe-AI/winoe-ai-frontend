function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 1 && value <= 100) return Math.min(1, value / 100);
  return Math.min(1, Math.max(0, value));
}

export function formatScorePercent(value: number): string {
  return `${Math.round(clampUnit(value) * 100)}%`;
}

export function formatRecommendationLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'hire') return 'Hire';
  if (normalized === 'lean_hire') return 'Lean Hire';
  if (normalized === 'no_hire') return 'No Hire';
  if (normalized === 'strong_hire') return 'Strong Hire';
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function recommendationToneClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'hire' || normalized === 'strong_hire') {
    return 'border-green-200 bg-green-50 text-green-700';
  }
  if (normalized === 'no_hire') {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export function formatRubricKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRubricValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatRubricValue(item))
      .filter((item) => item.length > 0);
    return parts.join(', ');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return 'N/A';
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

export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function printableEvidenceUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return value.replace(/[?#].*$/, '');
  }
}
