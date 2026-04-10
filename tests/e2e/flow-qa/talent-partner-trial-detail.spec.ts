import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_TRIAL_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';
import { TrialDetailQaPage } from './pages';

test.describe('TalentPartner Trial Detail Flows', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('trial detail loads plan and candidates table within budget @perf', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page);
    const detailPage = new TrialDetailQaPage(page);

    // Warm the route once to avoid Next.js cold-start skew on perf measurement.
    await detailPage.gotoDetail(QA_BASE_TRIAL_ID);
    await detailPage.expectPlanSection();
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const startMs = Date.now();
    const [detailResponse, candidatesResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/trials/${QA_BASE_TRIAL_ID}`) &&
          resp.status() === 200,
      ),
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/trials/${QA_BASE_TRIAL_ID}/candidates`) &&
          resp.status() === 200,
      ),
      page.reload(),
    ]);

    expect(detailResponse.status()).toBe(200);
    expect(candidatesResponse.status()).toBe(200);

    await expect(page).toHaveURL(`/dashboard/trials/${QA_BASE_TRIAL_ID}`);
    await detailPage.expectPlanSection();
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`candidate-compare-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:trial-detail-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.trialDetailMs);
  });
});
