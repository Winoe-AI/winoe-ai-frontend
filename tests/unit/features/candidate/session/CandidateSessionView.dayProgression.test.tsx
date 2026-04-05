import { fireEvent, render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import { buildCandidateSessionViewProps } from './CandidateSessionView.windowGating.testProps';

describe('CandidateSessionView day progression checkpoints', () => {
  it('renders Day 1 editor workflow with text input', () => {
    const props = buildCandidateSessionViewProps();
    props.currentTask = {
      id: 11,
      dayIndex: 1,
      type: 'design',
      title: 'Architecture brief',
      description: 'Write your architecture plan.',
    };
    props.currentDayIndex = 1;
    props.actionGate = {
      isReadOnly: false,
      disabledReason: null,
      comeBackAt: null,
    };
    props.windowState = {
      ...props.windowState,
      phase: 'open',
      dayIndex: 1,
      actionGate: props.actionGate,
      correctedByBackend: false,
      backendDetail: null,
    };

    render(<CandidateSessionView {...props} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Save draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/This day is closed and read-only/i),
    ).not.toBeInTheDocument();
  });

  it('renders Day 5 reflection fields in editable mode', () => {
    const props = buildCandidateSessionViewProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Final reflection',
      description: 'Summarize your decisions and next steps.',
    };
    props.currentDayIndex = 5;
    props.actionGate = {
      isReadOnly: false,
      disabledReason: null,
      comeBackAt: null,
    };
    props.windowState = {
      ...props.windowState,
      phase: 'open',
      dayIndex: 5,
      actionGate: props.actionGate,
      correctedByBackend: false,
      backendDetail: null,
    };

    render(<CandidateSessionView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /^Write$/i }));
    expect(
      screen.getByPlaceholderText(/Write your response here/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Markdown is supported/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Preview$/i }),
    ).toBeInTheDocument();
  });

  it('shows lockout-visible state for Day 5 when the window is closed', () => {
    const props = buildCandidateSessionViewProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Final reflection',
      description: 'Summarize your decisions and next steps.',
    };
    props.currentDayIndex = 5;
    props.actionGate = {
      isReadOnly: true,
      disabledReason: 'Day 5 locked until the active window opens.',
      comeBackAt: '2099-01-05T14:00:00Z',
    };
    props.windowState = {
      ...props.windowState,
      phase: 'closed_before_start',
      dayIndex: 5,
      countdownLabel: '0d 01h 00m 00s',
      countdownTargetAt: '2099-01-05T14:00:00Z',
      actionGate: props.actionGate,
      correctedByBackend: true,
      backendDetail: 'Closed by backend day window gate.',
    };

    render(<CandidateSessionView {...props} />);

    expect(screen.getByText(/^Day 5 is not open yet$/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Day 5 locked until the active window opens\./i),
    ).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /Submit & Continue/i }),
    ).toBeDisabled();
  });
});
