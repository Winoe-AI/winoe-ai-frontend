import { median, modeOf, toFixed, toInt } from './helpers';
import type {
  InteractionSampleMetric,
  PageSampleMetric,
  RouteDefinition,
} from './types';

export function aggregateRouteMetrics(
  raw: PageSampleMetric[],
  routes: RouteDefinition[],
) {
  return routes.map((route) => {
    const samples = raw.filter((entry) => entry.routeId === route.id);
    const successful = samples.filter((entry) => entry.status === 'ok');
    if (!successful.length) {
      return {
        routeId: route.id,
        page: route.page,
        routeTemplate: route.routeTemplate,
        successfulSamples: 0,
        sampleCount: samples.length,
        status: 'failed',
        error:
          samples
            .map((entry) => entry.error)
            .filter(Boolean)
            .join(' | ') || null,
      };
    }
    const representative = successful
      .slice()
      .sort((a, b) => a.mountLatencyMs - b.mountLatencyMs)[
      Math.floor(successful.length / 2)
    ];
    return {
      routeId: route.id,
      page: route.page,
      routeTemplate: route.routeTemplate,
      route: representative.route,
      resolvedUrl: representative.resolvedUrl,
      successfulSamples: successful.length,
      sampleCount: samples.length,
      status: successful.length === samples.length ? 'ok' : 'partial',
      fcpMs: toInt(median(successful.map((entry) => entry.fcpMs))),
      lcpMs: toInt(median(successful.map((entry) => entry.lcpMs))),
      ttiMs: toInt(median(successful.map((entry) => entry.ttiMs))),
      cls: toFixed(median(successful.map((entry) => entry.cls)), 4),
      tbtMs: toInt(median(successful.map((entry) => entry.tbtMs))),
      apiCalls: toInt(median(successful.map((entry) => entry.apiCalls))),
      apiWaitMs: toInt(median(successful.map((entry) => entry.apiWaitMs))),
      bundleKb: toFixed(median(successful.map((entry) => entry.bundleKb)), 1),
      mountLatencyMs: toInt(
        median(successful.map((entry) => entry.mountLatencyMs)),
      ),
      jsChunkCount: toInt(
        median(successful.map((entry) => entry.jsChunkCount)),
      ),
      assetCount: toInt(median(successful.map((entry) => entry.assetCount))),
      assetKb: toFixed(median(successful.map((entry) => entry.assetKb)), 1),
      waterfallType: modeOf(successful.map((entry) => entry.waterfallType)),
      apiTimeline: representative.apiTimeline,
    };
  });
}

export function aggregateInteractionMetrics(raw: InteractionSampleMetric[]) {
  const grouped = new Map<string, InteractionSampleMetric[]>();
  for (const entry of raw)
    grouped.set(entry.interaction, [
      ...(grouped.get(entry.interaction) ?? []),
      entry,
    ]);
  return [...grouped.entries()].map(([interaction, samples]) => {
    const successful = samples.filter((entry) => entry.status === 'ok');
    if (!successful.length)
      return {
        interaction,
        successfulSamples: 0,
        sampleCount: samples.length,
        status: 'failed',
        latencyMs: 0,
        error:
          samples
            .map((entry) => entry.error)
            .filter(Boolean)
            .join(' | ') || null,
      };
    return {
      interaction,
      successfulSamples: successful.length,
      sampleCount: samples.length,
      status: successful.length === samples.length ? 'ok' : 'partial',
      latencyMs: toInt(median(successful.map((entry) => entry.latencyMs))),
      error:
        successful.length === samples.length
          ? null
          : samples
              .map((entry) => entry.error)
              .filter(Boolean)
              .join(' | ') || null,
    };
  });
}
