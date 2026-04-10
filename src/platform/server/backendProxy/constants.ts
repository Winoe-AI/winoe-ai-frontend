import { envFlagEnabled } from '@/platform/config/envFlags';

export const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'host',
  'content-length',
  'accept-encoding',
  'upgrade',
  'keep-alive',
  'transfer-encoding',
  'cookie',
  'authorization',
]);

export const MAX_PROXY_BODY_BYTES = Number(
  process.env.WINOE_PROXY_MAX_BODY_BYTES ?? 2 * 1024 * 1024,
);
export const PROXY_TIMEOUT_MS = 20000;
export const LONG_PROXY_TIMEOUT_MS = 90000;
export const MAX_PROXY_RESPONSE_BYTES = Number(
  process.env.WINOE_PROXY_MAX_RESPONSE_BYTES ?? 2 * 1024 * 1024,
);

export const DEBUG_PROXY =
  envFlagEnabled(process.env.WINOE_DEBUG_PROXY) ||
  envFlagEnabled(process.env.WINOE_DEBUG);
