export function buildDay4StatusBody(params: {
  deleted: boolean;
  completed: boolean;
  statusAfterCompleteCalls: number;
}) {
  if (params.deleted) {
    return {
      recording: null,
      transcript: null,
      isDeleted: true,
      deletedAt: '2026-03-16T10:10:00.000Z',
      recordingStatus: 'deleted',
      transcriptStatus: 'deleted',
    };
  }
  if (!params.completed) {
    return { recording: null, transcript: null };
  }
  return params.statusAfterCompleteCalls === 1
    ? {
        recording: {
          recordingId: 'rec_123',
          status: 'uploaded',
          downloadUrl: 'https://cdn.example.com/rec_123.mp4',
        },
        transcript: {
          status: 'processing',
          progress: 40,
          text: null,
          segments: null,
        },
      }
    : {
        recording: {
          recordingId: 'rec_123',
          status: 'ready',
          downloadUrl: 'https://cdn.example.com/rec_123.mp4',
        },
        transcript: {
          status: 'ready',
          progress: null,
          text: 'Final transcript from backend.',
          segments: [{ id: null, startMs: 0, endMs: 1250, text: 'hello' }],
        },
      };
}
