import type { NextResponse } from 'next/server';
import { envFlagEnabled } from '@/platform/config/envFlags';
import { mergeResponseCookies } from '@/platform/server/bffAuth';
import { isNextResponse } from '@/platform/auth/proxyUtils';

export const startPerfTimer = () =>
  envFlagEnabled(process.env.WINOE_DEBUG_PERF) ? Date.now() : null;

type ResponderArgs = {
  authResponse: unknown;
  pathname: string;
  perfStart: number | null;
};

export function buildResponder({
  authResponse,
  pathname,
  perfStart,
}: ResponderArgs) {
  return (resp: NextResponse) => {
    if (isNextResponse(authResponse)) mergeResponseCookies(authResponse, resp);
    if (perfStart !== null) {
      // eslint-disable-next-line no-console
      console.log(
        `[perf:proxy] ${pathname} -> ${resp.status} ${Date.now() - perfStart}ms`,
      );
    }
    return resp;
  };
}
