import type { Browser } from '@playwright/test';
import type { InteractionSampleMetric, RuntimeIds } from '../types';
import { createInteractionContext } from './context';
import { runDay1Keystroke } from './day1Keystroke';
import { runDay4Upload } from './day4Upload';
import { runDay5Keystroke } from './day5Keystroke';
import { runFitProfileControls } from './fitProfileControls';
import { runRecruiterNavigation } from './recruiterNavigation';
import { runSimulationCreate } from './simulationCreate';
import { runSubmissionsExpand } from './submissionsExpand';

export async function runInteractionSample(params: { browser: Browser; ids: RuntimeIds; sample: number }): Promise<InteractionSampleMetric[]> {
  const { browser, ids, sample } = params;
  const context = createInteractionContext(browser, ids, sample);
  await runRecruiterNavigation(context);
  await runSimulationCreate(context);
  await runDay1Keystroke(context);
  await runDay5Keystroke(context);
  await runDay4Upload(context);
  await runSubmissionsExpand(context);
  await runFitProfileControls(context);
  return context.results;
}
