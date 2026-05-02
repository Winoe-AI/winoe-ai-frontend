import React, { forwardRef, useImperativeHandle } from 'react';
import { render } from '@testing-library/react';
import { useCandidateDerivedInfo } from '@/features/candidate/session/hooks/useCandidateDerivedInfo';

type HookReturn = ReturnType<typeof useCandidateDerivedInfo>;

const baseState = () =>
  ({
    bootstrap: {
      trial: { title: 'Sim Trial', role: 'Backend', company: 'Winoe' },
      completedAt: '2026-05-01T21:46:43Z',
    },
    taskState: {
      completedAt: '2026-05-05T13:00:00Z',
      completedTaskIds: [1, 2, 3, 4, 5],
      currentTask: null,
      isComplete: true,
    },
  }) as Parameters<typeof useCandidateDerivedInfo>[0];

const HookHarness = forwardRef<
  HookReturn,
  Parameters<typeof useCandidateDerivedInfo>[0]
>((props, ref) => {
  const hook = useCandidateDerivedInfo(props, null, null);
  useImperativeHandle(ref, () => hook, [hook]);
  return null;
});
HookHarness.displayName = 'HookHarness';

describe('useCandidateDerivedInfo', () => {
  it('prefers taskState.completedAt over stale bootstrap.completedAt', () => {
    const ref = React.createRef<HookReturn>();
    render(
      <HookHarness
        ref={ref}
        {...baseState()}
        taskState={{
          ...baseState().taskState,
          completedAt: '2026-05-05T13:00:00Z',
        }}
      />,
    );
    expect(ref.current?.completedAt).toBe('2026-05-05T13:00:00Z');
    expect(ref.current?.company).toBe('Winoe');
    expect(ref.current?.title).toBe('Sim Trial');
  });
});
