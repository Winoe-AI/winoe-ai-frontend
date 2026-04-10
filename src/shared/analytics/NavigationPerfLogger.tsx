'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { envFlagEnabled } from '@/platform/config/envFlags';

const isDebugPerf = () =>
  envFlagEnabled(process.env.NEXT_PUBLIC_WINOE_DEBUG_PERF);

export function NavigationPerfLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isDebugPerf() || typeof performance === 'undefined') return;
    const navEntries = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const duration =
      navEntries?.[0]?.duration && Number.isFinite(navEntries[0].duration)
        ? Math.round(navEntries[0].duration)
        : Math.round(performance.now());

    // eslint-disable-next-line no-console
    console.log(`[perf:navigation] ${pathname} duration=${duration}ms`);
  }, [pathname]);

  return null;
}
