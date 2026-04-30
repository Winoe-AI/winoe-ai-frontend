import {
  buildTranscriptSearchResults,
  formatTranscriptTimestamp,
  highlightTranscriptText,
} from '@/features/talent-partner/submission-review/components/ArtifactCard/day4Transcript';
import { normalizeTranscript } from '@/features/talent-partner/submission-review/utils/candidateSubmissionsApi.transcriptUtils';

describe('day4Transcript helpers', () => {
  it('formats transcript timestamps for mm:ss and hh:mm:ss', () => {
    expect(formatTranscriptTimestamp(0)).toBe('00:00');
    expect(formatTranscriptTimestamp(61_000)).toBe('01:01');
    expect(formatTranscriptTimestamp(3_661_000)).toBe('01:01:01');
  });

  it('matches transcript text case-insensitively and counts matches', () => {
    const result = buildTranscriptSearchResults(
      [
        { startMs: 0, endMs: 1000, text: 'Hello World' },
        { startMs: 1000, endMs: 2000, text: 'world building' },
      ],
      'WORLD',
    );

    expect(result.totalMatches).toBe(2);
    expect(result.segments[0].matchCount).toBe(1);
    expect(result.segments[1].matchCount).toBe(1);
  });

  it('tokenizes highlights safely without HTML injection paths', () => {
    const tokens = highlightTranscriptText(
      '<script>alert("x")</script> world',
      'script',
    );

    expect(tokens.some((token) => token.isMatch)).toBe(true);
    expect(tokens.map((token) => token.text).join('')).toContain('<script>');
  });

  it('normalizes backend transcript segments that use start/end fields', () => {
    const transcript = normalizeTranscript({
      transcript: {
        status: 'ready',
        text: 'Ready transcript',
        segments: [{ start: 0, end: 60000, text: 'Segment text' }],
      },
    });

    expect(transcript).toEqual({
      status: 'ready',
      text: 'Ready transcript',
      segments: [{ id: null, startMs: 0, endMs: 60000, text: 'Segment text' }],
    });
  });
});
