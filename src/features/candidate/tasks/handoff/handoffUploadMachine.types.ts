import type {
  HandoffStatusResponse,
  HandoffSupplementalMaterial,
  HandoffTranscriptSegment,
} from './handoffApi';

export type HandoffPanelPhase =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'deleted'
  | 'error'
  | 'window_closed';

export type HandoffUploadState = {
  phase: HandoffPanelPhase;
  uploadProgressPct: number;
  selectedFileName: string | null;
  selectedFileSizeBytes: number | null;
  selectedVideoDurationSeconds: number | null;
  recordingId: string | null;
  recordingStatus: string | null;
  previewUrl: string | null;
  previewSource: 'local' | 'persisted' | null;
  transcriptStatus: string;
  transcriptProgressPct: number | null;
  transcriptText: string | null;
  transcriptSegments: HandoffTranscriptSegment[] | null;
  supplementalMaterials: HandoffSupplementalMaterial[] | null;
  consentStatus: boolean | null;
  consentedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  canDelete: boolean | null;
  deleteDisabledReason: string | null;
  aiNoticeVersion: string | null;
  aiNoticeEnabled: boolean | null;
  aiNoticeSummaryUrl: string | null;
  errorMessage: string | null;
  windowClosedMessage: string | null;
};

export type HandoffUploadAction =
  | { type: 'STATUS_SYNCED'; payload: HandoffStatusResponse }
  | {
      type: 'VIDEO_VALIDATION_STARTED';
      fileName: string;
      fileSizeBytes: number;
    }
  | { type: 'VIDEO_VALIDATION_SUCCEEDED'; durationSeconds: number }
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_PROGRESS'; progressPct: number }
  | { type: 'UPLOAD_SUCCEEDED'; recordingId: string; previewUrl: string }
  | { type: 'UPLOAD_FAILED'; message: string }
  | { type: 'STATUS_FAILED'; message: string }
  | { type: 'WINDOW_CLOSED'; message: string }
  | { type: 'WINDOW_REOPENED' }
  | { type: 'DELETE_SUCCEEDED'; deletedAt: string | null }
  | { type: 'CLEAR_ERROR' };

export const initialHandoffUploadState: HandoffUploadState = {
  phase: 'idle',
  uploadProgressPct: 0,
  selectedFileName: null,
  selectedFileSizeBytes: null,
  selectedVideoDurationSeconds: null,
  recordingId: null,
  recordingStatus: null,
  previewUrl: null,
  previewSource: null,
  transcriptStatus: 'not_started',
  transcriptProgressPct: null,
  transcriptText: null,
  transcriptSegments: null,
  supplementalMaterials: null,
  consentStatus: null,
  consentedAt: null,
  isDeleted: false,
  deletedAt: null,
  canDelete: null,
  deleteDisabledReason: null,
  aiNoticeVersion: null,
  aiNoticeEnabled: null,
  aiNoticeSummaryUrl: null,
  errorMessage: null,
  windowClosedMessage: null,
};
