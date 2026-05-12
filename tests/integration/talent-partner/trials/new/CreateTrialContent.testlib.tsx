import '../../../setup/routerMock';
import { routerMock } from '../../../setup/routerMock';
import { createTrialV4 } from '@/features/talent-partner/api';

jest.mock('@/features/talent-partner/api', () => ({
  ...jest.requireActual('@/features/talent-partner/api'),
  createTrialV4: jest.fn(),
}));

type EsListener = (ev: MessageEvent) => void;

export class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  listeners: Record<string, EsListener[]> = {};
  closed = false;
  onopen: (() => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    queueMicrotask(() => this.onopen?.());
  }

  addEventListener(type: string, fn: EventListener) {
    const list = this.listeners[type] ?? [];
    list.push(fn as EsListener);
    this.listeners[type] = list;
  }

  removeEventListener() {
    /* not used */
  }

  dispatch(type: string, data: object) {
    const ev = { data: JSON.stringify(data) } as MessageEvent;
    for (const fn of this.listeners[type] ?? []) {
      fn(ev);
    }
  }

  close() {
    this.closed = true;
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'EventSource', {
    configurable: true,
    writable: true,
    value: MockEventSource,
  });
});

export const createTrialV4Mock = createTrialV4 as jest.MockedFunction<
  typeof createTrialV4
>;
export { routerMock };

export function resetCreateTrialMocks() {
  jest.resetAllMocks();
  MockEventSource.instances = [];
}
