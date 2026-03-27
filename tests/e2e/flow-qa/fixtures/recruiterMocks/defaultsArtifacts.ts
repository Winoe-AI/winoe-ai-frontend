import { iso } from './shared';

export function buildDefaultArtifacts(candidateSessionId: number) {
  return {
    501: {
      submissionId: 501,
      candidateSessionId,
      task: { taskId: 101, dayIndex: 1, type: 'design', title: 'Architecture brief', prompt: 'Describe your architecture approach.' },
      contentText: 'Day 1 architecture response.',
      testResults: null,
      submittedAt: iso('2026-03-13T11:00:00Z'),
    },
    502: {
      submissionId: 502,
      candidateSessionId,
      task: { taskId: 102, dayIndex: 2, type: 'code', title: 'Build feature', prompt: 'Ship feature implementation.' },
      contentText: null,
      repoUrl: 'https://github.com/tenon-ai/candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/2',
      testResults: { passed: 22, failed: 0, total: 22, stdout: 'All tests passed.', stderr: null },
      submittedAt: iso('2026-03-14T11:00:00Z'),
    },
    503: {
      submissionId: 503,
      candidateSessionId,
      task: { taskId: 103, dayIndex: 3, type: 'code', title: 'Debug and finalize', prompt: 'Fix defects and finalize.' },
      contentText: null,
      repoUrl: 'https://github.com/tenon-ai/candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/3',
      testResults: { passed: 20, failed: 1, total: 21, stdout: '1 failure found.', stderr: 'Expected true, received false' },
      submittedAt: iso('2026-03-15T11:00:00Z'),
    },
    504: {
      submissionId: 504,
      candidateSessionId,
      task: { taskId: 104, dayIndex: 4, type: 'handoff', title: 'Handoff demo', prompt: 'Upload your walkthrough.' },
      contentText: null,
      handoff: {
        recordingId: 'rec_504',
        downloadUrl: 'https://cdn.example.com/rec_504.mp4',
        recordingStatus: 'ready',
        transcript: { status: 'ready', text: 'Candidate walkthrough transcript.', segments: [{ id: 'seg1', startMs: 0, endMs: 1800, text: 'Walkthrough intro' }] },
      },
      testResults: null,
      submittedAt: iso('2026-03-16T11:00:00Z'),
    },
  } satisfies Record<number, Record<string, unknown>>;
}
