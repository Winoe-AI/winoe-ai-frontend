export function normalizeExcerpt(text: string): string {
  return text.trim().replace(/\n{3,}/g, '\n\n');
}

export function parseLineRangeLabel(
  range: { start: number | null; end: number | null } | null,
): string | null {
  if (!range) return null;
  if (range.start !== null && range.end !== null) {
    return `L${range.start}-L${range.end}`;
  }
  if (range.start !== null) return `L${range.start}`;
  return null;
}

export function formatCitationTimeRange(
  startMs: number | null,
  endMs: number | null,
): string | null {
  const formatMs = (ms: number | null): string | null => {
    if (ms === null || !Number.isFinite(ms) || ms < 0) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (startMs === null && endMs === null) return null;
  return `${formatMs(startMs) ?? '00:00'}${endMs !== null ? `–${formatMs(endMs) ?? '00:00'}` : ''}`;
}

export function formatCitationArtifactBody(
  renderMode: 'markdown' | 'code' | 'demo' | 'reflection',
  artifactRef: string,
  excerpt: string,
): string {
  const normalized = normalizeExcerpt(excerpt);
  if (renderMode === 'code') {
    return `/* ${artifactRef} */\n${normalized}`;
  }
  if (renderMode === 'demo') {
    return `${artifactRef}\n${normalized}`;
  }
  return normalized;
}
