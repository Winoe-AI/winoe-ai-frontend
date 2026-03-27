import { fireEvent } from '@testing-library/react';
import type { HandoffStatusResponse } from '@/features/candidate/tasks/handoff/handoffApi';

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

export function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

export function selectVideo(container: HTMLElement, filename = 'handoff.mp4') {
  fireEvent.change(getFileInput(container), {
    target: {
      files: [new File(['video-data'], filename, { type: 'video/mp4' })],
    },
  });
}

export function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
