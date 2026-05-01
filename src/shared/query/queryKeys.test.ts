import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('uses the singular candidate-session cache segment', () => {
    expect(queryKeys.talentPartner.candidateSubmissions(12, 34)).toEqual([
      'talent_partner',
      'trials',
      12,
      'candidate-session',
      34,
      'submissions',
    ]);
    expect(
      queryKeys.talentPartner.candidateSubmissionArtifacts(12, 34, [1, 2]),
    ).toEqual([
      'talent_partner',
      'trials',
      12,
      'candidate-session',
      34,
      'submission-artifacts',
      1,
      2,
    ]);
    expect(queryKeys.talentPartner.winoeReportStatus(34)).toEqual([
      'talent_partner',
      'candidate-session',
      34,
      'winoe-report-status',
    ]);
  });
});
