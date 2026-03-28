import { apiClient, login, safeRequest } from '@/platform/api-client/client';
import { responseHelpers } from '../../setup';

export const fetchMock = jest.fn();

export const resetApiClientMocks = () => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
};

export { apiClient, login, responseHelpers, safeRequest };
