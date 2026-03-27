import { resetBffTestState, restoreBffEnv } from './bff.testlib';

describe('bff __testables waitWithAbort', () => {
  beforeEach(() => {
    resetBffTestState();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    restoreBffEnv();
  });

  it('rejects immediately when signal is already aborted', async () => {
    const { __testables } = await import('@/lib/server/bff');
    const controller = new AbortController();
    controller.abort(new Error('pre-aborted'));
    await expect(__testables.waitWithAbort(1000, controller.signal)).rejects.toThrow('pre-aborted');
  });

  it('rejects when signal aborts during wait', async () => {
    jest.useFakeTimers();
    const { __testables } = await import('@/lib/server/bff');
    const controller = new AbortController();
    const promise = __testables.waitWithAbort(1000, controller.signal);
    controller.abort(new Error('mid-aborted'));
    jest.advanceTimersByTime(100);
    await expect(promise).rejects.toThrow('mid-aborted');
  });
});
