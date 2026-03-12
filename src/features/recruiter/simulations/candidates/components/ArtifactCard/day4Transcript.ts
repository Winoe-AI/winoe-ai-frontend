import type { HandoffTranscriptSegment } from '../../types';

export type HighlightToken = {
  text: string;
  isMatch: boolean;
};

export type SearchableTranscriptSegment = {
  key: string;
  segment: HandoffTranscriptSegment;
  highlights: HighlightToken[];
  matchCount: number;
};

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export function formatTranscriptTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function highlightTranscriptText(
  text: string,
  query: string,
): HighlightToken[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [{ text, isMatch: false }];

  const loweredText = text.toLowerCase();
  const tokens: HighlightToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = loweredText.indexOf(normalizedQuery, cursor);
    if (matchIndex === -1) {
      tokens.push({ text: text.slice(cursor), isMatch: false });
      break;
    }
    if (matchIndex > cursor) {
      tokens.push({ text: text.slice(cursor, matchIndex), isMatch: false });
    }
    const nextCursor = matchIndex + normalizedQuery.length;
    tokens.push({ text: text.slice(matchIndex, nextCursor), isMatch: true });
    cursor = nextCursor;
  }

  return tokens.length > 0 ? tokens : [{ text, isMatch: false }];
}

function countTextMatches(text: string, query: string): number {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return 0;
  const loweredText = text.toLowerCase();
  let cursor = 0;
  let matches = 0;

  while (cursor < loweredText.length) {
    const matchIndex = loweredText.indexOf(normalizedQuery, cursor);
    if (matchIndex === -1) break;
    matches += 1;
    cursor = matchIndex + normalizedQuery.length;
  }

  return matches;
}

export function buildTranscriptSearchResults(
  segments: HandoffTranscriptSegment[],
  query: string,
): { segments: SearchableTranscriptSegment[]; totalMatches: number } {
  let totalMatches = 0;
  const searchable = segments.map((segment, index) => {
    const key = `${segment.id ?? 'segment'}-${String(segment.startMs)}-${String(index)}`;
    const highlights = highlightTranscriptText(segment.text, query);
    const matchCount = countTextMatches(segment.text, query);
    totalMatches += matchCount;
    return {
      key,
      segment,
      highlights,
      matchCount,
    };
  });

  return {
    segments: searchable,
    totalMatches,
  };
}
