import {
  apiClient,
  safeRequest,
  login,
  isSameOriginRequest,
  recruiterBffClient,
  __resetHttpClientCache,
} from '@/platform/api-client/client';
import { responseHelpers } from '../setup';

const realFetch = global.fetch;
const originalDebug = process.env.NEXT_PUBLIC_TENON_DEBUG_PERF;

export const setupHttpClientBranchTest = () => {
  __resetHttpClientCache();
  global.fetch = jest.fn() as unknown as typeof fetch;
};

export const teardownHttpClientBranchTest = () => {
  (global.fetch as jest.Mock).mockReset?.();
  process.env.NEXT_PUBLIC_TENON_DEBUG_PERF = originalDebug;
};

export const restoreHttpClientBranchTest = () => {
  global.fetch = realFetch;
};

export {
  apiClient,
  safeRequest,
  login,
  isSameOriginRequest,
  recruiterBffClient,
  responseHelpers,
};
