import { jest } from '@jest/globals';
import { responseHelpers } from '../setup';

export const jsonRes = (
  body: unknown,
  status?: number,
  headers?: Record<string, string>,
) => responseHelpers.jsonResponse(body, status, headers) as unknown as Response;

export type FetchMock = jest.MockedFunction<typeof fetch>;

const originalApiBase = process.env.NEXT_PUBLIC_TENON_API_BASE_URL;

export async function importCandidateApi() {
  jest.resetModules();
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = 'http://api.example.com';
  return import('@/features/candidate/session/api');
}

export const installFetchMock = (fetchMock: FetchMock) => {
  global.fetch = fetchMock as unknown as typeof fetch;
};

export const restoreApiBase = () => {
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = originalApiBase;
};
