import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { HandoffUploadPanel } from '@/features/candidate/tasks/handoff/HandoffUploadPanel';
import type { Task } from '@/features/candidate/tasks/types';
import { makeStatus } from './HandoffUploadPanel.helpers';

export const initHandoffUploadMock = jest.fn();
export const uploadFileToSignedUrlMock = jest.fn();
export const completeHandoffUploadMock = jest.fn();
export const deleteHandoffUploadMock = jest.fn();
export const getHandoffStatusMock = jest.fn();

jest.mock('@/features/candidate/tasks/handoff/handoffApi', () => ({
  initHandoffUpload: (...args: unknown[]) => initHandoffUploadMock(...args),
  uploadFileToSignedUrl: (...args: unknown[]) =>
    uploadFileToSignedUrlMock(...args),
  completeHandoffUpload: (...args: unknown[]) =>
    completeHandoffUploadMock(...args),
  deleteHandoffUpload: (...args: unknown[]) => deleteHandoffUploadMock(...args),
  getHandoffStatus: (...args: unknown[]) => getHandoffStatusMock(...args),
}));

type ActionGate = {
  isReadOnly: boolean;
  disabledReason: string | null;
  comeBackAt: string | null;
};
export const baseTask: Task = {
  id: 4,
  dayIndex: 4,
  type: 'handoff',
  title: 'Handoff demo',
  description: 'Upload your walkthrough video.',
};
export const openGate: ActionGate = {
  isReadOnly: false,
  disabledReason: null,
  comeBackAt: null,
};
export const closedGate: ActionGate = {
  isReadOnly: true,
  disabledReason: 'Day closed.',
  comeBackAt: null,
};
const emptyStatus = makeStatus();
const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;
const originalCreateElement = document.createElement.bind(document);
let mockVideoDurationSeconds = 120;

export function setMockVideoDuration(seconds: number) {
  mockVideoDurationSeconds = seconds;
}

beforeEach(() => {
  jest.useFakeTimers();
  initHandoffUploadMock.mockReset();
  uploadFileToSignedUrlMock.mockReset();
  completeHandoffUploadMock.mockReset();
  deleteHandoffUploadMock.mockReset();
  getHandoffStatusMock.mockReset();
  URL.createObjectURL = jest.fn(() => 'blob://handoff-preview');
  URL.revokeObjectURL = jest.fn();
  mockVideoDurationSeconds = 120;
  document.createElement = ((
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    const element = originalCreateElement(tagName, options);
    if (tagName.toLowerCase() !== 'video') return element;
    Object.defineProperty(element, 'duration', {
      configurable: true,
      get: () => mockVideoDurationSeconds,
    });
    Object.defineProperty(element, 'src', {
      configurable: true,
      set: () => {
        queueMicrotask(() => {
          const video = element as HTMLVideoElement;
          video.onloadedmetadata?.(new Event('loadedmetadata'));
        });
      },
    });
    const video = element as HTMLVideoElement;
    video.removeAttribute = jest.fn();
    video.load = jest.fn();
    return element;
  }) as typeof document.createElement;
  getHandoffStatusMock.mockResolvedValue(emptyStatus);
  initHandoffUploadMock.mockResolvedValue({
    recordingId: 'rec_123',
    uploadUrl: 'https://storage.example.com/signed',
    expiresInSeconds: 900,
  });
  uploadFileToSignedUrlMock.mockResolvedValue(undefined);
  completeHandoffUploadMock.mockResolvedValue({
    recordingId: 'rec_123',
    status: 'uploaded',
  });
  deleteHandoffUploadMock.mockResolvedValue({
    deleted: true,
    deletedAt: '2026-03-16T10:05:00.000Z',
    status: 'deleted',
  });
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
afterAll(() => {
  URL.createObjectURL = originalCreateObjectUrl;
  URL.revokeObjectURL = originalRevokeObjectUrl;
  document.createElement = originalCreateElement;
});

export const renderPanel = (actionGate: ActionGate = openGate) =>
  render(
    <HandoffUploadPanel
      candidateSessionId={77}
      task={baseTask}
      actionGate={actionGate}
    />,
  );

export { act, fireEvent, screen, waitFor, within };
