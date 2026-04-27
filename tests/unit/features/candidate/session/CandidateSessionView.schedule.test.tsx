import { render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import { baseScheduleProps } from './CandidateSessionView.schedule.props';

const scheduleDayLabels = [
  'Day 1 — Planning & Design Doc',
  'Day 2 — Implementation Kickoff',
  'Day 3 — Implementation Wrap-Up',
  'Day 4 — Handoff + Demo',
  'Day 5 — Reflection Essay',
];

function expectAllScheduleDays() {
  for (const label of scheduleDayLabels) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
}

describe('CandidateSessionView scheduling states', () => {
  it('renders scheduling form state', () => {
    const props = baseScheduleProps();
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expectAllScheduleDays();
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders scheduling confirm state', () => {
    const props = baseScheduleProps();
    props.view = 'scheduleConfirm';
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/5-day schedule preview/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirm schedule/i }),
    ).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders locked state with countdown and day windows', () => {
    const props = baseScheduleProps();
    props.view = 'locked';
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/Trial locked until start/i)).toBeInTheDocument();
    expect(screen.getByText(/Starts in/i)).toBeInTheDocument();
    expect(screen.getByText(/5-day schedule preview/i)).toBeInTheDocument();
    expectAllScheduleDays();
    expect(screen.queryByText(/Project Brief/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Repository URL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Codespace/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Day 1 editor/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start trial/i }),
    ).not.toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
