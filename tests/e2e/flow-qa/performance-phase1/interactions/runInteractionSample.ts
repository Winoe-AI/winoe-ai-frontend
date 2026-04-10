import type { Browser } from '@playwright/test';
import type { InteractionSampleMetric, RuntimeIds } from '../types';
import { createInteractionContext } from './context';
import { runDay1Keystroke } from './day1Keystroke';
import { runDay4Upload } from './day4Upload';
import { runDay5Keystroke } from './day5Keystroke';
import { runWinoeReportControls } from './winoeReportControls';
import { runTalentPartnerNavigation } from './talent-partnerNavigation';
import { runTrialCreate } from './trialCreate';
import { runSubmissionsExpand } from './submissionsExpand';

export async function runInteractionSample(params: {
  browser: Browser;
  ids: RuntimeIds;
  sample: number;
}): Promise<InteractionSampleMetric[]> {
  const { browser, ids, sample } = params;
  const context = createInteractionContext(browser, ids, sample);
  await runTalentPartnerNavigation(context);
  await runTrialCreate(context);
  await runDay1Keystroke(context);
  await runDay5Keystroke(context);
  await runDay4Upload(context);
  await runSubmissionsExpand(context);
  await runWinoeReportControls(context);
  return context.results;
}
