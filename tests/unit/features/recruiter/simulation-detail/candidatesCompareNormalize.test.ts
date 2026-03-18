import {
  normalizeCandidateCompareList,
  normalizeCandidateCompareRow,
} from '@/features/recruiter/api/candidatesCompareNormalize';

describe('candidate compare normalization', () => {
  it('normalizes core compare row fields', () => {
    const row = normalizeCandidateCompareRow({
      candidate_session_id: 42,
      candidate: {
        name: 'Alex Doe',
        email: 'alex@example.com',
      },
      status: 'completed',
      fit_profile_status: 'ready',
      overall_fit_score: 82,
      recommendation: 'lean_hire',
      updated_at: '2026-03-16T02:03:04Z',
      key_strengths: ['Fast debugging', 'Clear communication'],
      key_risks: ['Needs stronger testing discipline'],
      day_completion: {
        day1: true,
        day2: false,
      },
    });

    expect(row.candidateSessionId).toBe('42');
    expect(row.candidateLabel).toBe('Alex Doe');
    expect(row.fitProfileStatus).toBe('ready');
    expect(row.overallFitScore).toBe(0.82);
    expect(row.recommendation).toBe('lean_hire');
    expect(row.strengths).toEqual(['Fast debugging', 'Clear communication']);
    expect(row.risks).toEqual(['Needs stronger testing discipline']);
    expect(row.dayCompletion).toEqual([
      { dayIndex: 1, completed: true },
      { dayIndex: 2, completed: false },
    ]);
  });

  it('defaults to not_generated when fit profile data is missing', () => {
    const row = normalizeCandidateCompareRow({
      candidateSessionId: 'cand-9',
      inviteEmail: 'cand9@example.com',
      status: 'not_started',
      overallFitScore: null,
      recommendation: null,
    });

    expect(row.candidateSessionId).toBe('cand-9');
    expect(row.candidateLabel).toBe('cand9@example.com');
    expect(row.fitProfileStatus).toBe('not_generated');
    expect(row.overallFitScore).toBeNull();
    expect(row.recommendation).toBeNull();
  });

  it('filters sensitive urls from strengths and risks', () => {
    const row = normalizeCandidateCompareRow({
      candidateSessionId: 7,
      candidateName: 'Sec Test',
      strengths: [
        'Builds reliable APIs',
        'https://bucket.s3.amazonaws.com/file?X-Amz-Signature=abc&X-Amz-Credential=def',
      ],
      risks:
        'Needs clearer docs, https://storage.test/path?x-goog-signature=abc123',
      artifactPayload: {
        signedUrl:
          'https://signed.test/file?X-Amz-Signature=secret&X-Amz-Credential=secret',
      },
    });

    expect(row.strengths).toEqual(['Builds reliable APIs']);
    expect(row.risks).toEqual(['Needs clearer docs']);
    expect((row as Record<string, unknown>).artifactPayload).toBeUndefined();
  });

  it('normalizes list payload shapes', () => {
    const list = normalizeCandidateCompareList({
      items: [
        { candidateSessionId: 1, candidateName: 'A' },
        { candidateSessionId: 2, candidateName: 'B' },
      ],
    });

    expect(list.map((item) => item.candidateSessionId)).toEqual(['1', '2']);
  });
});
