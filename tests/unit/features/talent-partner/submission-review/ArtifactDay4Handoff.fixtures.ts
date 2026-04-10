export const buildDay4Artifact = (overrides?: Record<string, unknown>) => ({
  submissionId: 44,
  candidateSessionId: 900,
  task: {
    taskId: 4,
    dayIndex: 4,
    type: 'handoff',
    title: 'Demo handoff',
    prompt: null,
  },
  contentText: null,
  testResults: null,
  submittedAt: '2026-03-10T12:00:00.000Z',
  handoff: {
    recordingId: 'rec_123',
    downloadUrl: 'https://cdn.example.com/rec_123.mp4',
    transcript: {
      status: 'ready',
      text: null,
      segments: [
        { startMs: 0, endMs: 1200, text: 'Hello world' },
        {
          startMs: 5000,
          endMs: 7000,
          text: '<script>alert("x")</script> world',
        },
      ],
    },
  },
  ...overrides,
});

export const buildNonHandoffDay4Artifact = (
  overrides?: Record<string, unknown>,
) =>
  buildDay4Artifact({
    task: {
      taskId: 41,
      dayIndex: 4,
      type: 'code',
      title: 'Day 4 code task',
      prompt: null,
    },
    handoff: null,
    ...overrides,
  });
