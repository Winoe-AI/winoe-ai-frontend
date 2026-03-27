import type { Browser } from '@playwright/test';
import { runLabel, PERF_MODE, BASE_URL } from './config';
import { collectRouteMetrics } from './collectRouteMetrics';
import { getErrorMessage, storagePath, toFixed, toInt } from './helpers';
import { disableCache, installVitalsObserver } from './metricsObserver';
import { setupMockRoutesForGroup } from './setupMockRoutes';
import type { PageSampleMetric, RouteDefinition, RuntimeIds } from './types';

export async function measureRouteSample(params: { browser: Browser; route: RouteDefinition; ids: RuntimeIds; sample: number }): Promise<PageSampleMetric> {
  const { browser, route, ids, sample } = params;
  const resolvedRoute = route.resolveRoute(ids);
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: storagePath(route.storageRole) });
  const page = await context.newPage();
  const result: PageSampleMetric = {
    runLabel, mode: PERF_MODE, sample, routeId: route.id, page: route.page, route: resolvedRoute, routeTemplate: route.routeTemplate, resolvedUrl: '', storageRole: route.storageRole, status: 'failed',
    httpStatus: null, error: null, fcpMs: 0, lcpMs: 0, ttiMs: 0, cls: 0, tbtMs: 0, apiCalls: 0, apiWaitMs: 0, bundleKb: 0, mountLatencyMs: 0, jsChunkCount: 0, assetCount: 0, assetKb: 0, waterfallType: 'none', apiTimeline: [],
  };

  try {
    await setupMockRoutesForGroup(page, route.group, ids);
    await installVitalsObserver(page);
    await disableCache(page);
    const startMs = Date.now();
    const response = await page.goto(resolvedRoute, { waitUntil: 'domcontentloaded' });
    result.httpStatus = response?.status() ?? null;
    await route.ready(page, ids);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(250);
    result.mountLatencyMs = Date.now() - startMs;
    const metrics = await collectRouteMetrics(page);
    result.fcpMs = toInt(metrics.fcpMs); result.lcpMs = toInt(metrics.lcpMs); result.ttiMs = toInt(metrics.ttiMs); result.cls = toFixed(metrics.cls, 4); result.tbtMs = toInt(metrics.tbtMs);
    result.apiCalls = metrics.apiCalls; result.apiWaitMs = toInt(metrics.apiWaitMs); result.bundleKb = toFixed(metrics.bundleKb, 1); result.jsChunkCount = metrics.jsChunkCount;
    result.assetCount = metrics.assetCount; result.assetKb = toFixed(metrics.assetKb, 1); result.waterfallType = metrics.waterfallType;
    result.apiTimeline = metrics.apiTimeline.map((item) => ({ url: item.url, startMs: toFixed(item.startMs, 1), endMs: toFixed(item.endMs, 1), durationMs: toFixed(item.durationMs, 1) }));
    result.resolvedUrl = page.url();
    result.status = 'ok';
  } catch (error) {
    result.error = getErrorMessage(error);
    result.resolvedUrl = page.url();
  } finally {
    await context.close();
  }
  return result;
}
