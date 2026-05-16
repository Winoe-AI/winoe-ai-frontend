import {
  formatDimensionScore,
  formatScoreOutOf100,
  formatWinoeScore,
  normalizeScoreOutOf10,
  normalizeScoreOutOf100,
} from '@/features/talent-partner/winoe-report/utils/reportFormatting';

describe('reportFormatting score normalization', () => {
  it('normalizes Winoe scores across unit and display scales', () => {
    expect(normalizeScoreOutOf100(0.6731)).toBeCloseTo(67.31, 2);
    expect(normalizeScoreOutOf100(67.31)).toBeCloseTo(67.31, 2);
    expect(normalizeScoreOutOf100(100)).toBe(100);
    expect(normalizeScoreOutOf100(200)).toBe(100);
    expect(normalizeScoreOutOf100(-1)).toBe(0);
    expect(formatScoreOutOf100(0.6731)).toBe('67.3 / 100');
    expect(formatScoreOutOf100(67.31)).toBe('67.3 / 100');
    expect(formatWinoeScore(0.6731)).toBe('67.3');
    expect(formatWinoeScore(67.31)).toBe('67.3');
  });

  it('normalizes dimension scores across unit, ten-point, and display scales', () => {
    expect(normalizeScoreOutOf10(0.74)).toBeCloseTo(7.4, 1);
    expect(normalizeScoreOutOf10(7.4)).toBeCloseTo(7.4, 1);
    expect(normalizeScoreOutOf10(10)).toBe(10);
    expect(normalizeScoreOutOf10(74)).toBeCloseTo(7.4, 1);
    expect(normalizeScoreOutOf10(200)).toBe(10);
    expect(normalizeScoreOutOf10(-1)).toBe(0);
    expect(formatDimensionScore(0.74)).toBe('7.4/10');
    expect(formatDimensionScore(7.4)).toBe('7.4/10');
  });
});
