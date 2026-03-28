import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/query/queryClient';

describe('createQueryClient', () => {
  it('creates a QueryClient with expected default query/mutation options', () => {
    const client = createQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    expect(client.getDefaultOptions()).toEqual({
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 0,
      },
    });
  });
});
