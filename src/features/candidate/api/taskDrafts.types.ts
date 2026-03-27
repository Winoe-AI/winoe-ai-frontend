export type CandidateTaskDraft = {
  taskId: number;
  contentText: string | null;
  contentJson: Record<string, unknown> | null;
  updatedAt: string;
  finalizedAt: string | null;
  finalizedSubmissionId: number | null;
};

export type CandidateTaskDraftPayload = {
  contentText?: string | null;
  contentJson?: Record<string, unknown> | null;
};

export type CandidateTaskDraftUpsertResponse = {
  taskId: number;
  updatedAt: string;
};
