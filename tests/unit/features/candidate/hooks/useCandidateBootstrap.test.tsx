import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useCandidateBootstrap } from '@/features/candidate/session/hooks/useCandidateBootstrap';

jest.mock('@/features/candidate/session/api', () => {
  const actual = jest.requireActual('@/features/candidate/session/api');
  return {
    __esModule: true,
    ...actual,
    resolveCandidateInviteToken: jest.fn(),
  };
});

const resolveMock = jest.requireMock('@/features/candidate/session/api')
  .resolveCandidateInviteToken as jest.Mock;

function Harness({
  inviteToken,
  onResolved,
  onSetInviteToken,
}: {
  inviteToken: string | null;
  onResolved: jest.Mock;
  onSetInviteToken?: jest.Mock;
}) {
  const { state, errorMessage, load } = useCandidateBootstrap({
    inviteToken,
    onResolved,
    onSetInviteToken,
  });

  return (
    <div>
      <div data-testid="state">{state}</div>
      <div data-testid="error">{errorMessage ?? ''}</div>
      <button onClick={() => void load()}>load</button>
    </div>
  );
}

describe('useCandidateBootstrap', () => {
  beforeEach(() => {
    resolveMock.mockReset();
  });

  it('loads bootstrap successfully', async () => {
    const onResolved = jest.fn();
    const inviteToken = 'tok_123';
    resolveMock.mockResolvedValue({
      candidateSessionId: 9,
      status: 'in_progress',
      trial: { title: 'Sim', role: 'Eng' },
    });

    render(<Harness inviteToken={inviteToken} onResolved={onResolved} />);

    await act(async () => {
      screen.getByText('load').click();
    });

    expect(resolveMock).toHaveBeenCalledWith(inviteToken);
    expect(onResolved).toHaveBeenCalledWith({
      candidateSessionId: 9,
      status: 'in_progress',
      trial: { title: 'Sim', role: 'Eng' },
    });
    expect(screen.getByTestId('state').textContent).toBe('ready');
  });

  it('surfaces error on failure', async () => {
    const onResolved = jest.fn();
    resolveMock.mockRejectedValue(
      Object.assign(new Error('bad'), { status: 404 }),
    );

    render(<Harness inviteToken="tok_err" onResolved={onResolved} />);

    await act(async () => {
      screen.getByText('load').click();
    });

    expect(onResolved).not.toHaveBeenCalled();
    expect(screen.getByTestId('state').textContent).toBe('error');
    expect(screen.getByTestId('error').textContent).toContain(
      'no longer valid',
    );
  });
});
