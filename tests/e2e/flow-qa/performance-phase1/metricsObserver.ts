import type { Page } from '@playwright/test';
import type { PerfWindowState } from './types';

export async function disableCache(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
}

export async function installVitalsObserver(page: Page) {
  await page.addInitScript(() => {
    const state = { lcp: 0, cls: 0, tbtMs: 0 };
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) state.lcp = last.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      const flushLcp = () => {
        const entries = lcpObserver.takeRecords();
        const last = entries[entries.length - 1];
        if (last) state.lcp = last.startTime;
      };
      addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushLcp();
      });
      addEventListener('pagehide', flushLcp);
    } catch {}
    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shift = entry as LayoutShift;
          if (!shift.hadRecentInput) state.cls += shift.value;
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries())
          if (entry.duration > 50) state.tbtMs += entry.duration - 50;
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {}
    (window as unknown as PerfWindowState).__tenonPerf = state;
  });
}
