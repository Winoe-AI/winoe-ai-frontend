import { act, render, screen } from '@testing-library/react';
import {
  baseProps,
  captureModalProps,
  copyInviteLinkMock,
  inviteFlowHookMock,
  inviteFlowResetMock,
  inviteFlowSubmitMock,
  notifyMock,
  resetDashboardViewMocks,
} from './DashboardView.testlib';
import DashboardView from '@/features/recruiter/dashboard/RecruiterDashboardView';

describe('DashboardView invite modal flow', () => {
  beforeEach(() => {
    resetDashboardViewMocks();
  });

  it('opens invite modal and triggers invite submission', async () => {
    const props = baseProps();
    await act(async () => render(<DashboardView {...props} />));

    act(() =>
      screen.getByTestId('simulation-section').querySelector('button')?.click(),
    );
    expect(inviteFlowResetMock).toHaveBeenCalled();
    expect(screen.getByTestId('invite-modal')).toBeInTheDocument();

    const modalProps = captureModalProps.mock.calls[0]?.[0] as {
      onSubmit: (n: string, e: string) => Promise<void>;
    };
    await act(async () => {
      await modalProps.onSubmit('Ann', 'a@test.com');
    });
    expect(inviteFlowSubmitMock).toHaveBeenCalledWith('Ann', 'a@test.com');
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('handles copy failures and invite resend state', async () => {
    const props = baseProps();
    copyInviteLinkMock.mockResolvedValueOnce(false);
    inviteFlowSubmitMock.mockResolvedValueOnce({
      inviteUrl: 'http://invite',
      outcome: 'resent',
      simulationId: '1',
      candidateName: 'Ann',
      candidateEmail: 'a@test.com',
    });

    await act(async () => render(<DashboardView {...props} />));
    act(() =>
      screen.getByTestId('simulation-section').querySelector('button')?.click(),
    );

    const modalProps = captureModalProps.mock.calls[0]?.[0] as {
      onSubmit: (n: string, e: string) => Promise<void>;
    };
    await act(async () => {
      await modalProps.onSubmit('Ann', 'a@test.com');
    });

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'success',
        title: expect.stringContaining('resent'),
        actions: expect.any(Array),
      }),
    );
    const copyAction = notifyMock.mock.calls[0][0]?.actions?.[0];
    await act(async () => {
      await copyAction.onClick();
    });
  });

  it('renders modal error state when invite flow is error', () => {
    inviteFlowHookMock.mockReturnValue({
      state: { status: 'error', message: 'bad' },
      submit: inviteFlowSubmitMock,
      reset: inviteFlowResetMock,
    });

    render(<DashboardView {...baseProps()} />);
    act(() =>
      screen.getByTestId('simulation-section').querySelector('button')?.click(),
    );

    const modalProps = captureModalProps.mock.calls[0]?.[0];
    expect(modalProps.state).toEqual({ status: 'error', message: 'bad' });
  });
});
