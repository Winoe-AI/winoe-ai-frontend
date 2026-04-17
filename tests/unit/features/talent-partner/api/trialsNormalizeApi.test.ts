import { normalizeTrial } from '@/features/talent-partner/api/trialsNormalizeApi';

describe('normalizeTrial', () => {
  it('defaults missing candidate counts to zero', () => {
    expect(
      normalizeTrial({
        id: 'trial-1',
        title: 'Backend Trial',
        role: 'Backend Engineer',
        createdAt: '2026-03-16T00:00:00Z',
        status: 'active_inviting',
      }),
    ).toMatchObject({
      id: 'trial-1',
      title: 'Backend Trial',
      role: 'Backend Engineer',
      createdAt: '2026-03-16T00:00:00Z',
      candidateCount: 0,
      status: 'active_inviting',
    });
  });

  it('preserves explicit candidate counts from the backend payload', () => {
    expect(
      normalizeTrial({
        trial_id: 'trial-2',
        trial_title: 'Frontend Trial',
        role_name: 'Frontend Engineer',
        created_at: '2026-03-17T00:00:00Z',
        candidate_count: 4,
        lifecycle_status: 'draft',
      }),
    ).toMatchObject({
      id: 'trial-2',
      title: 'Frontend Trial',
      role: 'Frontend Engineer',
      createdAt: '2026-03-17T00:00:00Z',
      candidateCount: 4,
      status: 'draft',
    });
  });

  it('returns a stable zero-count fallback for non-record payloads', () => {
    expect(normalizeTrial(null)).toMatchObject({
      id: '',
      title: 'Untitled trial',
      role: 'Unknown role',
      candidateCount: 0,
    });
  });
});
