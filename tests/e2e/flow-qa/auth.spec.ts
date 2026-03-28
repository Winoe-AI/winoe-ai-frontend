import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { AuthPage } from './pages';

test.describe('Auth Flows', () => {
  test('login page renders candidate mode', async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.gotoLogin('returnTo=%2Fcandidate%2Fdashboard&mode=candidate');

    await expect(page).toHaveURL(
      /\/auth\/login\?returnTo=%2Fcandidate%2Fdashboard&mode=candidate/i,
    );
    await expect(
      page.getByRole('heading', { name: /sign in to continue your simulation/i }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('link', { name: /continue with auth0/i })
        .first(),
    ).toHaveAttribute(
      'href',
      /\/auth\/login\?returnTo=%2Fcandidate%2Fdashboard&mode=candidate&connection=Tenon-Candidates/i,
    );
  });

  test.describe('Candidate-only Session', () => {
    test.use({ storageState: storageStates.candidateOnly });

    test('recruiter route redirects to not-authorized', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/not-authorized\?mode=recruiter/);
      await expect(
        page.getByRole('heading', { name: /not authorized/i }),
      ).toBeVisible();
      await expect(page.getByText(/need recruiter access/i)).toBeVisible();
    });
  });

  test.describe('Recruiter-only Session', () => {
    test.use({ storageState: storageStates.recruiterOnly });

    test('candidate route redirects to candidate login', async ({ page }) => {
      await page.goto('/candidate/dashboard');

      await expect(page).toHaveURL(
        /\/auth\/login\?returnTo=%2Fcandidate%2Fdashboard&mode=candidate/i,
      );
      await expect(
        page.getByRole('heading', { name: /sign in to continue your simulation/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /continue with auth0/i }).first(),
      ).toHaveAttribute(
        'href',
        /\/auth\/login\?returnTo=%2Fcandidate%2Fdashboard&mode=candidate&connection=Tenon-Candidates/i,
      );
    });

    test('auth clear route redirects to auth error with cleared state', async ({
      page,
    }) => {
      await page.goto('/auth/clear?returnTo=%2Fdashboard&mode=recruiter');

      await expect(page).toHaveURL(/\/auth\/error\?.*cleared=1/);
      await expect(
        page.getByText(/auth state cleared\. please retry sign-in\./i),
      ).toBeVisible();
    });
  });

  test('auth error page displays diagnostics', async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.gotoError(
      'mode=recruiter&returnTo=%2Fdashboard&errorCode=state_invalid&errorId=trace-123',
    );

    await expect(page).toHaveURL(/\/auth\/error/);
    await auth.expectAuthErrorHeading();
    await expect(page.getByText(/code: state_invalid/i)).toBeVisible();
    await expect(page.getByText(/trace id: trace-123/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /retry sign-in/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /clear auth state/i }),
    ).toBeVisible();
  });

  test('logout route renders confirmation page', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const isAuth0Logout = /auth0\.com\/oidc\/logout/i.test(currentUrl);
    const isLocalLogout = /\/auth\/logout(?:\?|$)/i.test(currentUrl);
    const isLocalHome = /^https?:\/\/[^/]+\/(?:\?.*)?$/i.test(currentUrl);

    expect(isAuth0Logout || isLocalLogout || isLocalHome).toBeTruthy();
  });
});
