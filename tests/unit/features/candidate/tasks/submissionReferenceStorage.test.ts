import {
  loadRecordedSubmissionReference,
  saveRecordedSubmissionReference,
} from '@/features/candidate/tasks/utils/submissionReferenceStorageUtils';

describe('submissionReferenceStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and reloads recorded submission by session and task key', () => {
    saveRecordedSubmissionReference(101, 7, {
      submissionId: 12,
      submittedAt: '2026-03-05T17:10:00Z',
    });

    expect(loadRecordedSubmissionReference(101, 7)).toEqual({
      submissionId: 12,
      submittedAt: '2026-03-05T17:10:00Z',
    });
  });

  it('isolates records across different session/task keys', () => {
    saveRecordedSubmissionReference(101, 7, {
      submissionId: 12,
      submittedAt: '2026-03-05T17:10:00Z',
    });
    saveRecordedSubmissionReference(101, 8, {
      submissionId: 13,
      submittedAt: '2026-03-05T18:10:00Z',
    });
    saveRecordedSubmissionReference(102, 7, {
      submissionId: 14,
      submittedAt: '2026-03-05T19:10:00Z',
    });

    expect(loadRecordedSubmissionReference(101, 7)?.submissionId).toBe(12);
    expect(loadRecordedSubmissionReference(101, 8)?.submissionId).toBe(13);
    expect(loadRecordedSubmissionReference(102, 7)?.submissionId).toBe(14);
  });

  it('returns null for malformed persisted payloads', () => {
    window.localStorage.setItem(
      'tenon:candidate:recordedSubmission:101:7',
      JSON.stringify({ submissionId: 'bad', submittedAt: 'invalid' }),
    );

    expect(loadRecordedSubmissionReference(101, 7)).toBeNull();
  });
});
