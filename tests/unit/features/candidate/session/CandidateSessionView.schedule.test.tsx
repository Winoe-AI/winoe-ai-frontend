import { render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import { baseScheduleProps } from './CandidateSessionView.schedule.props';

describe('CandidateSessionView scheduling states', () => {
  it('renders scheduling form state', () => {
    const props = baseScheduleProps();
    const { asFragment } = render(<CandidateSessionView {...props} />);
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
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
    expect(screen.getByText(/Day windows/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
