import { render, screen } from '@testing-library/react';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';

const useCandidateSessionControllerMock = jest.fn();

jest.mock(
  '@/features/candidate/session/hooks/useCandidateSessionController',
  () => ({
    useCandidateSessionController: (...args: unknown[]) =>
      useCandidateSessionControllerMock(...args),
  }),
);

jest.mock('@/features/candidate/session/CandidateSessionView', () => ({
  CandidateSessionView: ({ title }: { title?: string }) => (
    <div data-testid="candidate-session-view">{title ?? 'no-title'}</div>
  ),
}));

describe('CandidateSessionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes token to useCandidateSessionController', () => {
    useCandidateSessionControllerMock.mockReturnValue({ title: 'Running' });
    render(<CandidateSessionPage token="invite-token" />);
    expect(useCandidateSessionControllerMock).toHaveBeenCalledWith(
      'invite-token',
    );
  });

  it('renders CandidateSessionView with controller view model', () => {
    useCandidateSessionControllerMock.mockReturnValue({ title: 'Scheduling' });
    render(<CandidateSessionPage token="invite-token" />);
    expect(screen.getByTestId('candidate-session-view')).toHaveTextContent(
      'Scheduling',
    );
  });
});
