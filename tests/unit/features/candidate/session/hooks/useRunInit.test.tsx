import { renderHook } from '@testing-library/react';
import { useRunInit } from '@/features/candidate/session/hooks/useRunInit';

describe('useRunInit', () => {
  it('runs init on mount with current token', () => {
    const runInit = jest.fn();

    renderHook(() => useRunInit(runInit, 'token-a'));

    expect(runInit).toHaveBeenCalledTimes(1);
    expect(runInit).toHaveBeenCalledWith('token-a');
  });

  it('re-runs init when token changes', () => {
    const runInit = jest.fn();

    const { rerender } = renderHook(
      ({ token }: { token: string }) => useRunInit(runInit, token),
      { initialProps: { token: 'token-a' } },
    );

    rerender({ token: 'token-b' });

    expect(runInit).toHaveBeenCalledTimes(2);
    expect(runInit).toHaveBeenNthCalledWith(2, 'token-b');
  });

  it('re-runs init when runInit callback identity changes', () => {
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = renderHook(
      ({ fn }: { fn: (token: string) => void }) => useRunInit(fn, 'token-a'),
      { initialProps: { fn: first } },
    );

    rerender({ fn: second });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith('token-a');
  });
});
