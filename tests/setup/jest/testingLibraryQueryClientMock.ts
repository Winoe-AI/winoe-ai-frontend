import React from 'react';

jest.mock('@testing-library/react', () => {
  const actual = jest.requireActual('@testing-library/react') as typeof import('@testing-library/react');
  const ReactActual = jest.requireActual('react') as typeof import('react');
  const query = jest.requireActual('@tanstack/react-query') as typeof import('@tanstack/react-query');

  const createClient = () => new query.QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  type Wrapper = React.ComponentType<{ children: React.ReactNode }>;
  const withQueryClient = (wrapper?: Wrapper): Wrapper => {
    const client = createClient();
    return function QueryClientWrapper({ children }: { children: React.ReactNode }) {
      const content = wrapper ? ReactActual.createElement(wrapper, null, children) : children;
      return ReactActual.createElement(query.QueryClientProvider, { client }, content);
    };
  };

  return {
    ...actual,
    render: (ui: React.ReactNode, options?: Parameters<typeof actual.render>[1]) =>
      actual.render(ui, { ...options, wrapper: withQueryClient(options?.wrapper as Wrapper | undefined) }),
    renderHook: <Result, Props>(callback: (props: Props) => Result, options?: Parameters<typeof actual.renderHook<Result, Props>>[1]) =>
      actual.renderHook<Result, Props>(callback, { ...options, wrapper: withQueryClient(options?.wrapper as Wrapper | undefined) }),
  };
});
