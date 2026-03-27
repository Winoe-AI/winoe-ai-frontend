import fs from 'fs/promises';
import path from 'path';
import type { Browser } from '@playwright/test';
import {
  aggregateInteractionMetrics,
  aggregateRouteMetrics,
} from './aggregate';
import {
  DEFAULT_IDS,
  interactionOutputFile,
  outputFile,
  pageInventoryFile,
  PERF_MODE,
  rawArtifactsDir,
  runLabel,
  SAMPLE_COUNT,
} from './config';
import { buildPageInventory } from './inventory';
import { discoverLiveIds } from './liveIds';
import { measureRouteSample } from './measureRouteSample';
import { routeDefinitions } from './routes';
import { runInteractionSample } from './interactions/runInteractionSample';
import type { InteractionSampleMetric, PageSampleMetric } from './types';

export async function runPerformancePass(browser: Browser) {
  const routes = routeDefinitions();
  const ids =
    PERF_MODE === 'live' ? await discoverLiveIds(browser) : { ...DEFAULT_IDS };
  const allPageSamples: PageSampleMetric[] = [];
  const allInteractionSamples: InteractionSampleMetric[] = [];
  for (let sample = 1; sample <= SAMPLE_COUNT; sample += 1) {
    const samplePages: PageSampleMetric[] = [];
    for (const route of routes) {
      const pageSample = await measureRouteSample({
        browser,
        route,
        ids,
        sample,
      });
      samplePages.push(pageSample);
      allPageSamples.push(pageSample);
    }
    const sampleInteractions = await runInteractionSample({
      browser,
      ids,
      sample,
    });
    allInteractionSamples.push(...sampleInteractions);
    await fs.mkdir(rawArtifactsDir, { recursive: true });
    await fs.writeFile(
      path.join(rawArtifactsDir, `sample-${sample}.json`),
      `${JSON.stringify({ runLabel, mode: PERF_MODE, sample, measuredAt: new Date().toISOString(), ids, pages: samplePages, interactions: sampleInteractions }, null, 2)}\n`,
      'utf8',
    );
  }

  const pageMedian = aggregateRouteMetrics(allPageSamples, routes);
  const interactionMedian = aggregateInteractionMetrics(allInteractionSamples);
  const measuredAt = new Date().toISOString();
  const payload = {
    runLabel,
    mode: PERF_MODE,
    sampleCount: SAMPLE_COUNT,
    measuredAt,
    ids,
    pages: { median: pageMedian, raw: allPageSamples },
    interactions: { median: interactionMedian, raw: allInteractionSamples },
  };
  const interactionPayload = {
    runLabel,
    mode: PERF_MODE,
    sampleCount: SAMPLE_COUNT,
    measuredAt,
    median: interactionMedian,
    raw: allInteractionSamples,
  };
  const inventoryPayload = buildPageInventory(routes);
  await Promise.all([
    fs.mkdir(path.dirname(outputFile), { recursive: true }),
    fs.mkdir(path.dirname(interactionOutputFile), { recursive: true }),
    fs.mkdir(path.dirname(pageInventoryFile), { recursive: true }),
  ]);
  await Promise.all([
    fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'),
    fs.writeFile(
      interactionOutputFile,
      `${JSON.stringify(interactionPayload, null, 2)}\n`,
      'utf8',
    ),
    fs.writeFile(
      pageInventoryFile,
      `${JSON.stringify(inventoryPayload, null, 2)}\n`,
      'utf8',
    ),
  ]);
  return { routes, pageMedian };
}
