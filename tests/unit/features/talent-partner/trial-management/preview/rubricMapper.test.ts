import { mapRubricJsonToRows } from '@/features/talent-partner/trial-management/preview/rubricMapper';

describe('mapRubricJsonToRows', () => {
  it('maps array of dimension objects', () => {
    const rows = mapRubricJsonToRows([
      {
        dimension: 'Architecture',
        whatWinoeWillLookFor: 'Clear structure',
        weight: 0.3,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].dimension).toBe('Architecture');
    expect(rows[0].whatWinoeWillLookFor).toBe('Clear structure');
    expect(rows[0].weightLabel).toBe('0.3');
  });

  it('returns empty for null', () => {
    expect(mapRubricJsonToRows(null)).toEqual([]);
  });
});
