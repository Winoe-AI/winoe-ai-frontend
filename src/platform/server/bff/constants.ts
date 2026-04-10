import { BRAND_SLUG } from '@/platform/config/brand';
import { envFlagEnabled } from '@/platform/config/envFlags';

export const UPSTREAM_HEADER = `x-${BRAND_SLUG}-upstream-status`;
export const REQUEST_ID_HEADER = 'x-winoe-request-id';
export const DEBUG_PERF = envFlagEnabled(process.env.WINOE_DEBUG_PERF);
export const USE_FETCH_DISPATCHER = envFlagEnabled(
  process.env.WINOE_USE_FETCH_DISPATCHER,
);
