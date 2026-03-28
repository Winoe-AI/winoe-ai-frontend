import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_SIMULATION_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_CREATED_SIMULATION_ID,
} from './fixtures/constants';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';

test.describe('Recruiter Critical Journey (flow-qa mocked)', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('dashboard -> create simulation -> invite -> submissions -> fit profile', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page, {
      simulationId: QA_BASE_SIMULATION_ID,
      createSimulationId: QA_CREATED_SIMULATION_ID,
      candidateSessionId: QA_CANDIDATE_SESSION_ID,
    });

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /frontend platform modernization/i }),
    ).toBeVisible();

    await page.goto('/dashboard/simulations/new');
    await expect(
      page.getByRole('heading', { name: /new simulation/i }),
    ).toBeVisible();
    await page.getByLabel(/title/i).fill('QA Critical Journey Sim');
    await page.getByLabel(/^role$/i).fill('Senior Frontend Engineer');
    await page.getByLabel(/tech stack/i).fill('TypeScript + Next.js');

    const createButton = page.getByRole('button', {
      name: /create simulation/i,
    });
    await expect(createButton).toBeEnabled();

    const createResponsePromise = page.waitForResponse(
      (resp) =>
        new URL(resp.url()).pathname === '/api/simulations' &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );
    const createdSimulationUrl = `/dashboard/simulations/${QA_CREATED_SIMULATION_ID}`;
    const createRedirectPromise = page.waitForURL(createdSimulationUrl, {
      timeout: 30_000,
    });

    await createButton.click();
    const createResponse = await createResponsePromise;
    const createPayload = (await createResponse.json()) as { id?: unknown };
    expect(String(createPayload.id ?? '')).toBe(QA_CREATED_SIMULATION_ID);
    await createRedirectPromise;

    await expect(page).toHaveURL(createdSimulationUrl);
    await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();

    await page
      .getByRole('button', { name: /invite candidate/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toBeVisible();
    await page.getByLabel(/candidate name/i).fill('Casey Candidate');
    await page
      .getByLabel(/candidate email/i)
      .fill('casey.candidate@example.com');

    const inviteResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/invite') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );
    await page.getByRole('button', { name: /^send invite$/i }).click();
    await inviteResponsePromise;

    await expect(
      page.getByText(/Invite sent for Casey Candidate/i),
    ).toBeVisible();

    await page.goto(
      `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );
    await expect(
      page.getByRole('heading', { name: /submissions/i }),
    ).toBeVisible();
    await expect(page.getByText(/latest github artifacts/i)).toBeVisible();

    const fitProfileUrl = `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/fit-profile`;
    await page.goto(fitProfileUrl);

    await expect(page).toHaveURL(fitProfileUrl);
    await expect(
      page.getByRole('heading', { name: /^fit profile$/i }),
    ).toBeVisible();
    await expect(page.getByText(/overall fit score/i)).toBeVisible();
  });
});
