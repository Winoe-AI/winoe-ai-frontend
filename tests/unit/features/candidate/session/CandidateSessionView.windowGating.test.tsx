import { render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import type { CandidateSessionViewProps } from '@/features/candidate/session/views/types';

function buildProps(): CandidateSessionViewProps {
  return {
    view: 'running',
    authStatus: 'ready',
    authMessage: null,
    title: 'Infra Simulation',
    role: 'Backend Engineer',
    errorMessage: null,
    errorStatus: null,
    inviteErrorCopy: '',
    isComplete: false,
    started: true,
    currentDayIndex: 1,
    completedCount: 0,
    currentTask: {
      id: 10,
      dayIndex: 1,
      type: 'design',
      title: 'Prompt',
      description: 'Respond in markdown.',
    },
    submitting: false,
    taskError: null,
    taskLoading: false,
    resourceLink: null,
    candidateSessionId: 321,
    showWorkspacePanel: false,
    showRecordingPanel: false,
    showDocsPanel: false,
    loginHref: '/auth/login',
    scheduleDate: '2099-01-01',
    scheduleTimezone: 'America/New_York',
    scheduleTimezoneDetected: 'America/New_York',
    scheduleTimezoneOptions: ['America/New_York'],
    scheduleDateError: null,
    scheduleTimezoneError: null,
    scheduleSubmitError: null,
    schedulePreviewWindows: [],
    scheduleResponseWindows: [
      {
        dayIndex: 1,
        windowStartAt: '2099-01-01T14:00:00Z',
        windowEndAt: '2099-01-01T22:00:00Z',
      },
    ],
    scheduleCurrentDayWindow: {
      dayIndex: 1,
      windowStartAt: '2099-01-01T14:00:00Z',
      windowEndAt: '2099-01-01T22:00:00Z',
      state: 'upcoming',
    },
    scheduleCountdownLabel: '0d 00h 30m 00s',
    scheduleCountdownTargetAt: '2099-01-01T14:00:00Z',
    scheduleDisplayTimezone: 'America/New_York',
    scheduleDisplayStartAt: '2099-01-01T14:00:00Z',
    windowState: {
      phase: 'closed_before_start',
      dayIndex: 1,
      windowStartAt: '2099-01-01T14:00:00Z',
      windowEndAt: '2099-01-01T22:00:00Z',
      nextOpenAt: '2099-01-01T14:00:00Z',
      countdownTargetAt: '2099-01-01T14:00:00Z',
      countdownLabel: '0d 00h 30m 00s',
      actionGate: {
        isReadOnly: true,
        disabledReason:
          'This day is not open yet. Workspace, tests, and submit stay disabled until the window starts.',
        comeBackAt: '2099-01-01T14:00:00Z',
      },
      correctedByBackend: true,
      backendDetail: 'Task is closed outside the scheduled window.',
    },
    actionGate: {
      isReadOnly: true,
      disabledReason:
        'This day is not open yet. Workspace, tests, and submit stay disabled until the window starts.',
      comeBackAt: '2099-01-01T14:00:00Z',
    },
    lastDraftSavedAt: null,
    lastSubmissionAt: null,
    lastSubmissionId: null,
    onStart: jest.fn(),
    onDashboard: jest.fn(),
    onRetryInit: jest.fn(),
    onGoHome: jest.fn(),
    onRetryTask: jest.fn(),
    onScheduleDateChange: jest.fn(),
    onScheduleTimezoneChange: jest.fn(),
    onScheduleContinue: jest.fn(),
    onScheduleBack: jest.fn(),
    onScheduleConfirm: jest.fn(),
    onScheduleRetry: jest.fn(),
    onRefreshScheduleLock: jest.fn(),
    onSubmit: jest.fn(),
    onStartTests: jest.fn().mockResolvedValue({ runId: 'run-1' }),
    onPollTests: jest.fn().mockResolvedValue({ status: 'running' }),
    onTaskWindowClosed: jest.fn(),
  };
}

describe('CandidateSessionView window gating', () => {
  it('renders countdown/read-only banner and disables submit', () => {
    render(<CandidateSessionView {...buildProps()} />);

    expect(screen.getByText(/^Day 1 is not open yet$/i)).toBeInTheDocument();
    expect(screen.getByText(/Come back at/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit & continue/i }),
    ).toBeDisabled();
  });
});
