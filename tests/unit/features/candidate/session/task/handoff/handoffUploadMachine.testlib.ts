import type { HandoffStatusResponse } from '@/features/candidate/session/task/handoff/handoffApi';

export function makeStatus(
  overrides: Partial<HandoffStatusResponse> = {},
): HandoffStatusResponse {
  return {
    recordingId: null,
    recordingStatus: null,
    recordingDownloadUrl: null,
    transcriptStatus: 'not_started',
    transcriptProgressPct: null,
    transcriptText: null,
    transcriptSegments: null,
    consentStatus: null,
    consentedAt: null,
    isDeleted: false,
    deletedAt: null,
    canDelete: null,
    deleteDisabledReason: null,
    aiNoticeVersion: null,
    aiNoticeEnabled: null,
    aiNoticeSummaryUrl: null,
    ...overrides,
  };
}
