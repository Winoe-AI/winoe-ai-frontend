import '@testing-library/jest-dom';
import React from 'react';

jest.mock('@testing-library/react', () => {
  const actual = jest.requireActual(
    '@testing-library/react',
  ) as typeof import('@testing-library/react');
  const ReactActual = jest.requireActual('react') as typeof import('react');
  const query = jest.requireActual(
    '@tanstack/react-query',
  ) as typeof import('@tanstack/react-query');

  const createClient = () =>
    new query.QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

  type Wrapper = React.ComponentType<{ children: React.ReactNode }>;

  const withQueryClient = (wrapper?: Wrapper): Wrapper => {
    const client = createClient();
    return function QueryClientWrapper({
      children,
    }: {
      children: React.ReactNode;
    }) {
      const content = wrapper
        ? ReactActual.createElement(wrapper, null, children)
        : children;
      return ReactActual.createElement(
        query.QueryClientProvider,
        { client },
        content,
      );
    };
  };

  return {
    ...actual,
    render: (
      ui: React.ReactNode,
      options?: Parameters<typeof actual.render>[1],
    ) => {
      return actual.render(ui, {
        ...options,
        wrapper: withQueryClient(options?.wrapper as Wrapper | undefined),
      });
    },
    renderHook: <Result, Props>(
      callback: (props: Props) => Result,
      options?: Parameters<typeof actual.renderHook<Result, Props>>[1],
    ) => {
      return actual.renderHook<Result, Props>(callback, {
        ...options,
        wrapper: withQueryClient(options?.wrapper as Wrapper | undefined),
      });
    },
  };
});

// Suppress noisy warnings that clutter CI output (baseline-browser-mapping age,
// React act(...) notices) so precommit logs stay clean.
const shouldSilence = (message: unknown) =>
  typeof message === 'string' &&
  (message.includes('baseline-browser-mapping') ||
    message.includes('not wrapped in act(') ||
    message.startsWith(
      '[security] /api/auth/access-token is disabled outside local',
    ) ||
    message.startsWith(
      '[security] /api/dev/access-token is disabled outside local',
    ));

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalError(...args);
};

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalLog(...args);
};

jest.mock('remark-gfm', () => () => null);
jest.mock('remark-breaks', () => () => null);

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    const asString = Array.isArray(children)
      ? children.join('')
      : ((children as string) ?? '');
    const lines = String(asString ?? '').split(/\n+/);
    const elements: Array<React.ReactNode> = [];
    let listItems: Array<React.ReactNode> = [];

    const parseInline = (text: string) => {
      const nodes: Array<React.ReactNode> = [];
      let remaining = text;
      const matcher = /(\*\*(.+?)\*\*|\*(.+?)\*)/;

      while (remaining.length) {
        const match = matcher.exec(remaining);
        if (!match) {
          nodes.push(remaining);
          break;
        }
        if (match.index > 0) {
          nodes.push(remaining.slice(0, match.index));
        }
        const tag = match[1].startsWith('**') ? 'strong' : 'em';
        const content = match[2] ?? match[3] ?? '';
        nodes.push(
          React.createElement(tag, { key: `inline-${nodes.length}` }, content),
        );
        remaining = remaining.slice(match.index + match[1].length);
      }

      return nodes;
    };

    const flushList = () => {
      if (listItems.length === 0) return;
      elements.push(
        React.createElement('ul', { key: `list-${elements.length}` }, [
          ...listItems,
        ]),
      );
      listItems = [];
    };

    lines.forEach((line, idx) => {
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          React.createElement(
            'h1',
            { key: `h1-${idx}` },
            parseInline(line.slice(2)),
          ),
        );
        return;
      }
      if (line.startsWith('- ')) {
        listItems.push(
          React.createElement(
            'li',
            { key: `li-${idx}` },
            parseInline(line.slice(2)),
          ),
        );
        return;
      }
      flushList();
      if (line.trim()) {
        elements.push(
          React.createElement('p', { key: `p-${idx}` }, parseInline(line)),
        );
      }
    });
    flushList();

    return React.createElement(
      'div',
      { 'data-testid': 'react-markdown', className },
      elements,
    );
  };
});

function canCallCompatFn(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  if (typeof value !== 'function') return false;
  const maybeMock = value as {
    _isMockFunction?: boolean;
    getMockImplementation?: () => unknown;
  };
  if (!maybeMock._isMockFunction) return true;
  return (
    typeof maybeMock.getMockImplementation === 'function' &&
    maybeMock.getMockImplementation() != null
  );
}

jest.mock('@/features/candidate/api/invites', () => {
  const actual = jest.requireActual('@/features/candidate/api/invites');
  const resolveCompat = () => {
    try {
      return jest.requireMock('@/features/candidate/api') as Record<
        string,
        unknown
      >;
    } catch {
      return {} as Record<string, unknown>;
    }
  };
  const call = (name: string, args: unknown[]) => {
    const compat = resolveCompat();
    const fn = compat[name];
    if (canCallCompatFn(fn)) return fn(...args);
    const fallback = (actual as Record<string, unknown>)[name];
    if (typeof fallback === 'function') return fallback(...args);
    return undefined;
  };
  return {
    ...actual,
    listCandidateInvites: (...args: unknown[]) =>
      call('listCandidateInvites', args),
    resolveCandidateInviteToken: (...args: unknown[]) =>
      call('resolveCandidateInviteToken', args),
  };
});

jest.mock('@/features/candidate/api/tasks', () => {
  const actual = jest.requireActual('@/features/candidate/api/tasks');
  const resolveCompat = () => {
    try {
      return jest.requireMock('@/features/candidate/api') as Record<
        string,
        unknown
      >;
    } catch {
      return {} as Record<string, unknown>;
    }
  };
  const call = (name: string, args: unknown[]) => {
    const compat = resolveCompat();
    const fn = compat[name];
    if (canCallCompatFn(fn)) return fn(...args);
    const fallback = (actual as Record<string, unknown>)[name];
    if (typeof fallback === 'function') return fallback(...args);
    return undefined;
  };
  return {
    ...actual,
    getCandidateCurrentTask: (...args: unknown[]) =>
      call('getCandidateCurrentTask', args),
    submitCandidateTask: (...args: unknown[]) =>
      call('submitCandidateTask', args),
  };
});

jest.mock('@/features/candidate/api/schedule', () => {
  const actual = jest.requireActual('@/features/candidate/api/schedule');
  const resolveCompat = () => {
    try {
      return jest.requireMock('@/features/candidate/api') as Record<
        string,
        unknown
      >;
    } catch {
      return {} as Record<string, unknown>;
    }
  };
  return {
    ...actual,
    scheduleCandidateSession: (...args: unknown[]) => {
      const compat = resolveCompat();
      const fn = compat.scheduleCandidateSession;
      if (canCallCompatFn(fn)) return fn(...args);
      return (
        actual as { scheduleCandidateSession: (...a: unknown[]) => unknown }
      ).scheduleCandidateSession(...args);
    },
  };
});

jest.mock('@/features/candidate/api/tests', () => {
  const actual = jest.requireActual('@/features/candidate/api/tests');
  const resolveCompat = () => {
    try {
      return jest.requireMock('@/features/candidate/api') as Record<
        string,
        unknown
      >;
    } catch {
      return {} as Record<string, unknown>;
    }
  };
  const call = (name: string, args: unknown[]) => {
    const compat = resolveCompat();
    const fn = compat[name];
    if (canCallCompatFn(fn)) return fn(...args);
    const fallback = (actual as Record<string, unknown>)[name];
    if (typeof fallback === 'function') return fallback(...args);
    return undefined;
  };
  return {
    ...actual,
    startCandidateTestRun: (...args: unknown[]) =>
      call('startCandidateTestRun', args),
    pollCandidateTestRun: (...args: unknown[]) =>
      call('pollCandidateTestRun', args),
  };
});

jest.mock('@/features/candidate/api/taskDrafts', () => {
  const actual = jest.requireActual('@/features/candidate/api/taskDrafts');
  const resolveCompat = () => {
    try {
      return jest.requireMock('@/features/candidate/api') as Record<
        string,
        unknown
      >;
    } catch {
      return {} as Record<string, unknown>;
    }
  };
  const call = (name: string, args: unknown[]) => {
    const compat = resolveCompat();
    const fn = compat[name];
    if (canCallCompatFn(fn)) return fn(...args);
    const fallback = (actual as Record<string, unknown>)[name];
    if (typeof fallback === 'function') return fallback(...args);
    return undefined;
  };
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      call('getCandidateTaskDraft', args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      call('putCandidateTaskDraft', args),
  };
});
