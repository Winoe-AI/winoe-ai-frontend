import React, { forwardRef, useImperativeHandle } from 'react';
import { render } from '@testing-library/react';
import { useTaskSubmission } from '@/features/candidate/session/hooks/useTaskSubmission';

export const submitCandidateTaskMock = jest.fn();
export const notifyMock = jest.fn();
const normalizeApiErrorMock = jest.fn((err, fallback) => ({
  message: fallback ?? String(err),
}));

jest.mock('@/features/candidate/session/api', () => ({
  HttpError: class HttpError extends Error {
    status?: number;
    constructor(status?: number) {
      super('http');
      this.status = status;
    }
  },
  submitCandidateTask: (payload: unknown) => submitCandidateTaskMock(payload),
}));

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock }),
}));

jest.mock('@/platform/errors/errors', () => ({
  __esModule: true,
  normalizeApiError: (error: unknown, fallback?: string) =>
    normalizeApiErrorMock(error, fallback),
}));

type HookParams = Parameters<typeof useTaskSubmission>[0];
export type HookReturn = ReturnType<typeof useTaskSubmission>;

const HookHarness = forwardRef<HookReturn, HookParams>(
  function HookHarness(props, ref) {
    const hook = useTaskSubmission(props);
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  },
);

export const buildHookProps = (): HookParams => ({
  candidateSessionId: 11,
  currentTask: {
    id: 1,
    dayIndex: 1,
    type: 'design',
    title: 'Design',
    description: '',
  },
  clearTaskError: jest.fn(),
  setTaskError: jest.fn(),
  refreshTask: jest.fn().mockResolvedValue(undefined),
  onTaskWindowClosed: jest.fn(),
  onSubmissionRecorded: jest.fn(),
});

export const renderTaskSubmissionHarness = (
  props: HookParams = buildHookProps(),
) => {
  const ref = React.createRef<HookReturn>();
  const rendered = render(<HookHarness ref={ref} {...props} />);
  return { props, ref, unmount: rendered.unmount };
};

export const setupTaskSubmissionExtraTest = () => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  normalizeApiErrorMock.mockImplementation((err, fallback) => ({
    message: (fallback as string) ?? String(err),
  }));
};

export const teardownTaskSubmissionExtraTest = () => {
  jest.useRealTimers();
};
