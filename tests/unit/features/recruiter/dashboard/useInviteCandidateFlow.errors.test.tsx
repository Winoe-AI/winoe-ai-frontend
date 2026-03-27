import React, { forwardRef, useImperativeHandle } from 'react';
import { act, render } from '@testing-library/react';
import { useInviteCandidateFlow } from '@/features/recruiter/dashboard/hooks/useInviteCandidateFlow';

const inviteCandidateMock = jest.fn();
const formatRecruiterErrorMock = jest.fn(() => 'friendly-error');

jest.mock('@/features/recruiter/api', () => ({
  inviteCandidate: (...args: unknown[]) => inviteCandidateMock(...args),
}));

jest.mock('@/features/recruiter/utils/formatters', () => ({
  formatRecruiterError: (...args: unknown[]) => formatRecruiterErrorMock(...args),
}));

type HookReturn = ReturnType<typeof useInviteCandidateFlow>;

const HookHarness = forwardRef<
  HookReturn,
  { simulation: { simulationId: string; simulationTitle: string } | null }
>(function Harness(props, ref) {
  const hook = useInviteCandidateFlow(props.simulation);
  useImperativeHandle(ref, () => hook, [hook]);
  return null;
});

describe('useInviteCandidateFlow error mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps specific errors to friendly messages', async () => {
    const ref = React.createRef<HookReturn>();
    render(<HookHarness ref={ref} simulation={{ simulationId: 'sim-1', simulationTitle: 'Sim' }} />);

    inviteCandidateMock.mockRejectedValue({
      status: 409,
      details: { error: { code: 'candidate_already_completed' } },
    });
    await act(async () => {
      expect(await ref.current?.submit('Bob', 'bob@test.com')).toBeNull();
    });
    expect(ref.current?.state.status).toBe('error');
    expect(ref.current?.state.message).toMatch(/already completed/i);

    inviteCandidateMock.mockRejectedValue({ status: 422 });
    await act(async () => {
      expect(await ref.current?.submit('Bob', 'bad')).toBeNull();
    });
    expect(ref.current?.state.message).toMatch(/valid email/i);

    inviteCandidateMock.mockRejectedValue({ status: 429 });
    await act(async () => {
      expect(await ref.current?.submit('Bob', 'bob@test.com')).toBeNull();
    });
    expect(ref.current?.state.message).toMatch(/Too many invites/i);

    inviteCandidateMock.mockRejectedValue({ status: 500 });
    await act(async () => {
      expect(await ref.current?.submit('Bob', 'bob@test.com')).toBeNull();
    });
    expect(formatRecruiterErrorMock).toHaveBeenCalled();
  });
});
