import type { Page } from '@playwright/test';
import type { PerfWindowState, RouteMetricEval, WaterfallType } from './types';

export async function collectRouteMetrics(page: Page): Promise<RouteMetricEval> {
  return page.evaluate(() => {
    const perfWindow = window as unknown as PerfWindowState;
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | null;
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry | null;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const sizeFor = (entry: PerformanceResourceTiming) => (entry.transferSize && entry.transferSize > 0 ? entry.transferSize : entry.encodedBodySize && entry.encodedBodySize > 0 ? entry.encodedBodySize : entry.decodedBodySize || 0);
    const normalizeUrl = (rawUrl: string) => { try { const parsed = new URL(rawUrl); return `${parsed.pathname}${parsed.search}`; } catch { return rawUrl; } };
    const apiResources = resources.filter((entry) => entry.name.includes('/api/'));
    const apiTimeline = apiResources.map((entry) => ({ url: normalizeUrl(entry.name), startMs: entry.startTime, endMs: entry.startTime + entry.duration, durationMs: entry.duration })).sort((a, b) => a.startMs - b.startMs);

    let waterfallType: WaterfallType = 'none';
    if (apiTimeline.length > 0) {
      let hasOverlap = false;
      let latestEndMs = apiTimeline[0].endMs;
      for (let i = 1; i < apiTimeline.length; i += 1) {
        const current = apiTimeline[i];
        if (current.startMs < latestEndMs - 1) { hasOverlap = true; break; }
        latestEndMs = Math.max(latestEndMs, current.endMs);
      }
      waterfallType = hasOverlap ? 'parallel' : 'sequential';
    }

    const jsResources = resources.filter((entry) => { try { return /\/\_next\/static\/.*\.js(\?.*)?$/.test(new URL(entry.name).pathname); } catch { return /\/\_next\/static\/.*\.js(\?.*)?$/.test(entry.name); } });
    const assetResources = resources.filter((entry) => !entry.name.startsWith('data:') && !entry.name.includes('/api/'));
    const bundleBytes = jsResources.reduce((sum, entry) => sum + sizeFor(entry), 0);
    const assetBytes = assetResources.reduce((sum, entry) => sum + sizeFor(entry), 0);
    const apiWaitMs = apiResources.reduce((sum, entry) => sum + entry.duration, 0);
    const uniqueJsChunks = new Set(jsResources.map((entry) => { try { return new URL(entry.name).pathname; } catch { return entry.name; } }));

    return {
      fcpMs: fcpEntry?.startTime ?? 0, lcpMs: perfWindow.__tenonPerf?.lcp ?? 0, ttiMs: navEntry?.domInteractive ?? 0, cls: perfWindow.__tenonPerf?.cls ?? 0,
      tbtMs: perfWindow.__tenonPerf?.tbtMs ?? 0, apiCalls: apiResources.length, apiWaitMs, bundleKb: bundleBytes / 1024, jsChunkCount: uniqueJsChunks.size,
      assetCount: assetResources.length, assetKb: assetBytes / 1024, waterfallType,
      apiTimeline: apiTimeline.map((item) => ({ url: item.url, startMs: item.startMs, endMs: item.endMs, durationMs: item.durationMs })),
    };
  });
}
