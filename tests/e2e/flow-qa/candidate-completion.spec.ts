import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN, QA_PAGE_BUDGETS } from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installCandidateSessionMocks } from './fixtures/candidateMocks';

test.describe('Candidate Completion Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('completion view renders when session is already complete @perf', async ({
    page,
  }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: null,
      completedTaskIds: [1, 2, 3, 4, 5],
      isCompleteInitially: true,
    });

    const startMs = Date.now();

    const bootstrapResponsePromise = page.waitForResponse(
      (resp) =>
        resp
          .url()
          .includes(`/api/backend/candidate/session/${QA_INVITE_TOKEN}`) &&
        resp.status() === 200,
    );

    await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);
    const bootstrapResponse = await bootstrapResponsePromise;

    expect(bootstrapResponse.status()).toBe(200);
    await expect(page).toHaveURL(`/candidate/session/${QA_INVITE_TOKEN}`);
    await expect(page.getByText(/simulation complete/i)).toBeVisible();
    await expect(
      page.getByText(
        /you.{0,2}ve submitted all 5 days\. you can close this tab now\./i,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /start simulation/i }),
    ).toHaveCount(0);

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:candidate-completion-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.candidateSessionMs);
  });
});
