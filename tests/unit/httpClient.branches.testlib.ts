import {
  apiClient,
  safeRequest,
  login,
  isSameOriginRequest,
  talentPartnerBffClient,
  __resetHttpClientCache,
} from '@/platform/api-client/client';
import { responseHelpers } from '../setup';

const realFetch = global.fetch;
const originalDebug = process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF;

export const setupHttpClientBranchTest = () => {
  __resetHttpClientCache();
  global.fetch = jest.fn() as unknown as typeof fetch;
};

export const teardownHttpClientBranchTest = () => {
  (global.fetch as jest.Mock).mockReset?.();
  process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = originalDebug;
};

export const restoreHttpClientBranchTest = () => {
  global.fetch = realFetch;
};

export {
  apiClient,
  safeRequest,
  login,
  isSameOriginRequest,
  talentPartnerBffClient,
  responseHelpers,
};
