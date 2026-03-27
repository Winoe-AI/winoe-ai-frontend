import { apiClient, login, safeRequest } from '@/lib/api/client';
import { responseHelpers } from '../../setup';

export const fetchMock = jest.fn();

export const resetApiClientMocks = () => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
};

export { apiClient, login, responseHelpers, safeRequest };
