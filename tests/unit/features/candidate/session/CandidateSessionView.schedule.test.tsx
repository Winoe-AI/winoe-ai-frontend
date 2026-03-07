import { render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import type { CandidateSessionViewProps } from '@/features/candidate/session/views/types';

const baseProps = (): CandidateSessionViewProps => ({
  view: 'scheduling',
  authStatus: 'ready',
  authMessage: null,
  title: 'Infra Simulation',
  role: 'Backend Engineer',
  errorMessage: null,
  errorStatus: null,
  inviteErrorCopy: '',
  isComplete: false,
  started: false,
  currentDayIndex: 1,
  completedCount: 0,
  currentTask: null,
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
  scheduleTimezoneOptions: ['America/New_York', 'America/Chicago'],
  scheduleDateError: null,
  scheduleTimezoneError: null,
  scheduleSubmitError: null,
  schedulePreviewWindows: [
    {
      dayIndex: 1,
      windowStartAt: '2099-01-01T14:00:00Z',
      windowEndAt: '2099-01-01T22:00:00Z',
    },
    {
      dayIndex: 2,
      windowStartAt: '2099-01-02T14:00:00Z',
      windowEndAt: '2099-01-02T22:00:00Z',
    },
  ],
  scheduleResponseWindows: [
    {
      dayIndex: 1,
      windowStartAt: '2099-01-01T14:00:00Z',
      windowEndAt: '2099-01-01T22:00:00Z',
    },
    {
      dayIndex: 2,
      windowStartAt: '2099-01-02T14:00:00Z',
      windowEndAt: '2099-01-02T22:00:00Z',
    },
  ],
  scheduleCurrentDayWindow: {
    dayIndex: 1,
    windowStartAt: '2099-01-01T14:00:00Z',
    windowEndAt: '2099-01-01T22:00:00Z',
    state: 'upcoming',
  },
  scheduleCountdownLabel: '2d 01h 30m 10s',
  scheduleCountdownTargetAt: '2099-01-01T14:00:00Z',
  scheduleDisplayTimezone: 'America/New_York',
  scheduleDisplayStartAt: '2099-01-01T14:00:00Z',
  windowState: {
    phase: 'open',
    dayIndex: 1,
    windowStartAt: '2099-01-01T14:00:00Z',
    windowEndAt: '2099-01-01T22:00:00Z',
    nextOpenAt: null,
    countdownTargetAt: null,
    countdownLabel: null,
    actionGate: {
      isReadOnly: false,
      disabledReason: null,
      comeBackAt: null,
    },
    correctedByBackend: false,
    backendDetail: null,
  },
  actionGate: {
    isReadOnly: false,
    disabledReason: null,
    comeBackAt: null,
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
});

describe('CandidateSessionView scheduling states', () => {
  it('renders scheduling form state', () => {
    const props = baseProps();
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders scheduling confirm state', () => {
    const props = baseProps();
    props.view = 'scheduleConfirm';
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/5-day schedule preview/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirm schedule/i }),
    ).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders locked state with countdown and day windows', () => {
    const props = baseProps();
    props.view = 'locked';
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(
      screen.getByText(/Simulation locked until start/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Starts in/i)).toBeInTheDocument();
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
