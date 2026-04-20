import React, { forwardRef, useImperativeHandle } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useInviteCandidateFlow } from '@/features/talent-partner/dashboard/hooks/useInviteCandidateFlow';

const inviteCandidateMock = jest.fn();
const formatTalentPartnerErrorMock = jest.fn(() => 'friendly-error');

jest.mock('@/features/talent-partner/api', () => ({
  inviteCandidate: (...args: unknown[]) => inviteCandidateMock(...args),
}));

jest.mock('@/features/talent-partner/utils/formattersUtils', () => ({
  formatTalentPartnerError: (...args: unknown[]) =>
    formatTalentPartnerErrorMock(...args),
}));

type HookReturn = ReturnType<typeof useInviteCandidateFlow>;

type HarnessProps = {
  trial: { trialId: string; trialTitle: string } | null;
};
const HookHarness = forwardRef<HookReturn, HarnessProps>(
  function Harness(props, ref) {
    const hook = useInviteCandidateFlow(props.trial);
    useImperativeHandle(ref, () => hook, [hook]);
    return null;
  },
);

describe('useInviteCandidateFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects empty trial and missing name/email', async () => {
    const ref = React.createRef<HookReturn>();
    render(<HookHarness ref={ref} trial={null} />);

    await act(async () => {
      const res = await ref.current?.submit('', '');
      expect(res).toBeNull();
      expect(ref.current?.state.status).toBe('idle');
    });

    render(
      <HookHarness
        ref={ref}
        trial={{ trialId: 'trial-1', trialTitle: 'Sim' }}
      />,
    );
    await act(async () => {
      const res = await ref.current?.submit('', '');
      expect(res).toBeNull();
    });
    await waitFor(() => expect(ref.current?.state.status).toBe('error'));
    expect(ref.current?.state.message).toContain('required');
  });

  it('submits successfully and resets state', async () => {
    const ref = React.createRef<HookReturn>();
    inviteCandidateMock.mockResolvedValue({
      inviteUrl: 'http://invite',
      outcome: 'created',
    });
    render(
      <HookHarness
        ref={ref}
        trial={{ trialId: 'trial-1', trialTitle: 'Sim' }}
      />,
    );

    await act(async () => {
      const res = await ref.current?.submit('Ann', 'ann@test.com');
      expect(res).toMatchObject({
        inviteUrl: 'http://invite',
        outcome: 'created',
        trialId: 'trial-1',
        candidateName: 'Ann',
        candidateEmail: 'ann@test.com',
      });
    });
    expect(inviteCandidateMock).toHaveBeenCalledWith(
      'trial-1',
      'Ann',
      'ann@test.com',
    );
    expect(ref.current?.state).toMatchObject({
      status: 'success',
      inviteUrl: 'http://invite',
      candidateName: 'Ann',
      candidateEmail: 'ann@test.com',
      outcome: 'created',
    });
  });

  it('reset returns state to idle', () => {
    const ref = React.createRef<HookReturn>();
    render(
      <HookHarness
        ref={ref}
        trial={{ trialId: 'trial-1', trialTitle: 'Sim' }}
      />,
    );
    act(() => ref.current?.reset());
    expect(ref.current?.state.status).toBe('idle');
  });
});
