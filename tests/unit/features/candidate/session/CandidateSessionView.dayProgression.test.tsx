import { render, screen } from '@testing-library/react';
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

  it('renders Day 5 reflection markdown editor in editable mode', () => {
    const props = buildCandidateSessionViewProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Reflection Essay',
      description: 'Reflect on your full Trial experience.',
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

    expect(
      screen.getByRole('heading', { name: /reflection essay editor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/9:00 AM–9:00 PM your local time/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('textbox', { name: /markdown editor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Preview$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    ).toBeInTheDocument();
  });

  it('shows lockout-visible state for Day 5 when the window is closed', () => {
    const props = buildCandidateSessionViewProps();
    props.currentTask = {
      id: 15,
      dayIndex: 5,
      type: 'documentation',
      title: 'Reflection Essay',
      description: 'Reflect on your full Trial experience.',
    };
    props.currentDayIndex = 5;
    props.actionGate = {
      isReadOnly: true,
      disabledReason: null,
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
      screen.getByRole('heading', {
        name: /day 5 opens at 9:00 am local time/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/come back at/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit reflection essay/i }),
    ).toBeNull();
  });
});
