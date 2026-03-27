import {
  deriveWindowState,
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';

const dayWindows = [
  {
    dayIndex: 2,
    windowStartAt: '2099-01-03T14:00:00Z',
    windowEndAt: '2099-01-03T22:00:00Z',
  },
];
const buildState = (
  nowMs: number,
  override: Parameters<typeof deriveWindowState>[0]['override'] = null,
) =>
  deriveWindowState({
    dayWindows,
    currentDayIndex: 2,
    currentDayWindow: null,
    override,
    nowMs,
  });

const buildOverride = (nextOpenAt: string | null = '2099-01-04T14:00:00Z') => ({
  errorCode: 'TASK_WINDOW_CLOSED' as const,
  windowStartAt: '2099-01-04T14:00:00Z',
  windowEndAt: '2099-01-04T22:00:00Z',
  nextOpenAt,
  detail: 'Task is closed outside the scheduled window.',
  receivedAtMs: Date.now(),
});

describe('windowState', () => {
  it('derives open state inside the window', () => {
    const state = buildState(Date.parse('2099-01-03T16:00:00Z'));
    expect(state.phase).toBe('open');
    expect(state.actionGate.isReadOnly).toBe(false);
    expect(state.actionGate.disabledReason).toBeNull();
  });

  it('derives closed_before_start with countdown', () => {
    const state = buildState(Date.parse('2099-01-03T13:30:00Z'));
    expect(state.phase).toBe('closed_before_start');
    expect(state.countdownTargetAt).toBe('2099-01-03T14:00:00Z');
    expect(state.countdownLabel).toMatch(/\d+d/);
    expect(state.actionGate.isReadOnly).toBe(true);
    expect(state.actionGate.comeBackAt).toBe('2099-01-03T14:00:00Z');
  });

  it('derives closed_after_end after the window', () => {
    const state = buildState(Date.parse('2099-01-03T22:30:00Z'));
    expect(state.phase).toBe('closed_after_end');
    expect(state.actionGate.isReadOnly).toBe(true);
    expect(state.actionGate.comeBackAt).toBeNull();
  });

  it('applies backend override precedence and uses nextOpenAt', () => {
    const state = buildState(
      Date.parse('2099-01-03T16:00:00Z'),
      buildOverride(),
    );
    expect(state.phase).toBe('closed_before_start');
    expect(state.correctedByBackend).toBe(true);
    expect(state.actionGate.comeBackAt).toBe('2099-01-04T14:00:00Z');
  });

  it('extracts TASK_WINDOW_CLOSED details from nested payload', () => {
    const override = extractTaskWindowClosedOverride({
      status: 409,
      details: {
        errorCode: 'TASK_WINDOW_CLOSED',
        detail: 'Task is closed outside the scheduled window.',
        details: {
          windowStartAt: '2099-01-03T14:00:00Z',
          windowEndAt: '2099-01-03T22:00:00Z',
          nextOpenAt: '2099-01-03T14:00:00Z',
        },
      },
    });

    expect(override).not.toBeNull();
    expect(override?.windowStartAt).toBe('2099-01-03T14:00:00Z');
    expect(override?.nextOpenAt).toBe('2099-01-03T14:00:00Z');
    expect(formatComeBackMessage(override!)).toMatch(/come back at/i);
  });

  it('transitions from pre-start override to open at windowStartAt', () => {
    const override = {
      ...buildOverride('2099-01-03T14:00:00Z'),
      windowStartAt: '2099-01-03T14:00:00Z',
      windowEndAt: '2099-01-03T22:00:00Z',
    };

    const beforeStart = buildState(
      Date.parse('2099-01-03T13:59:59Z'),
      override,
    );
    const afterStart = buildState(Date.parse('2099-01-03T14:00:01Z'), override);
    expect(beforeStart.phase).toBe('closed_before_start');
    expect(beforeStart.actionGate.isReadOnly).toBe(true);
    expect(afterStart.phase).toBe('open');
    expect(afterStart.actionGate.isReadOnly).toBe(false);
  });

  it('transitions from open to closed_after_end at windowEndAt', () => {
    const override = {
      ...buildOverride(null),
      windowStartAt: '2099-01-03T14:00:00Z',
      windowEndAt: '2099-01-03T22:00:00Z',
    };
    const openState = buildState(Date.parse('2099-01-03T21:59:59Z'), override);
    const closedState = buildState(
      Date.parse('2099-01-03T22:00:00Z'),
      override,
    );

    expect(openState.phase).toBe('open');
    expect(openState.actionGate.isReadOnly).toBe(false);
    expect(closedState.phase).toBe('closed_after_end');
    expect(closedState.actionGate.isReadOnly).toBe(true);
  });
});
