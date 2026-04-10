import {
  apiClient,
  __resetHttpClientCache,
} from '@/platform/api-client/client';
import { responseHelpers } from '../setup';

const realFetch = global.fetch;
const originalDebug = process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF;

export {
  apiClient,
  responseHelpers,
  __resetHttpClientCache,
  realFetch,
  originalDebug,
};

export function resetHttpClientExtraMocks() {
  __resetHttpClientCache();
  global.fetch = jest.fn() as unknown as typeof fetch;
}

export function restoreHttpClientExtraEnv() {
  (global.fetch as jest.Mock).mockReset?.();
  process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF = originalDebug;
}
