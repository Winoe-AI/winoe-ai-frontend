import { renderHook, act } from '@testing-library/react';
import { useInviteModalActions } from '@/features/talent-partner/trial-management/detail/components/InviteModalActions';

describe('useInviteModalActions', () => {
  it('opens modal after resetting state', () => {
    const resetInviteFlow = jest.fn();
    const setInviteModalOpen = jest.fn();

    const { result } = renderHook(() =>
      useInviteModalActions({
        resetInviteFlow,
        setInviteModalOpen,
        inviteEnabled: true,
      }),
    );

    act(() => {
      result.current.openInviteModal();
    });

    expect(resetInviteFlow).toHaveBeenCalledTimes(1);
    expect(setInviteModalOpen).toHaveBeenCalledWith(true);
  });

  it('closes modal after resetting state', () => {
    const resetInviteFlow = jest.fn();
    const setInviteModalOpen = jest.fn();

    const { result } = renderHook(() =>
      useInviteModalActions({
        resetInviteFlow,
        setInviteModalOpen,
        inviteEnabled: true,
      }),
    );

    act(() => {
      result.current.closeInviteModal();
    });

    expect(resetInviteFlow).toHaveBeenCalledTimes(1);
    expect(setInviteModalOpen).toHaveBeenCalledWith(false);
  });

  it('does not open modal when invites are disabled', () => {
    const resetInviteFlow = jest.fn();
    const setInviteModalOpen = jest.fn();

    const { result } = renderHook(() =>
      useInviteModalActions({
        resetInviteFlow,
        setInviteModalOpen,
        inviteEnabled: false,
      }),
    );

    act(() => {
      result.current.openInviteModal();
    });

    expect(resetInviteFlow).not.toHaveBeenCalled();
    expect(setInviteModalOpen).not.toHaveBeenCalled();
  });
});
