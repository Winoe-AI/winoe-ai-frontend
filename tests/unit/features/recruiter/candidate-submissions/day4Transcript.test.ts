import {
  buildTranscriptSearchResults,
  formatTranscriptTimestamp,
  highlightTranscriptText,
} from '@/features/recruiter/simulations/candidates/components/ArtifactCard/day4Transcript';

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
});
