export type HandoffUploadInitResponse = {
  recordingId: string;
  uploadUrl: string;
  expiresInSeconds: number;
};

export type HandoffUploadCompleteResponse = {
  recordingId: string;
  status: string;
};

export type HandoffConsentPayload = {
  consented: boolean;
  aiNoticeVersion?: string | null;
};

export type HandoffDeleteResponse = {
  deleted: boolean;
  deletedAt: string | null;
  status: string | null;
};

export type HandoffTranscriptSegment = {
  id: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

export type HandoffStatusResponse = {
  recordingId: string | null;
  recordingStatus: string | null;
  recordingDownloadUrl: string | null;
  transcriptStatus: string;
  transcriptProgressPct: number | null;
  transcriptText: string | null;
  transcriptSegments: HandoffTranscriptSegment[] | null;
  consentStatus: boolean | null;
  consentedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  canDelete: boolean | null;
  deleteDisabledReason: string | null;
  aiNoticeVersion: string | null;
  aiNoticeEnabled: boolean | null;
  aiNoticeSummaryUrl: string | null;
};

export type RequestScope = 'init' | 'complete' | 'status' | 'consent' | 'delete';
