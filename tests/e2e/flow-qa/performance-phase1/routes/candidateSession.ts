import { expect } from '@playwright/test';
import { waitForAnyVisible } from '../helpers';
import type { RouteDefinition } from '../types';

export const candidateSessionRoutes: RouteDefinition[] = [
  {
    id: 'candidate-session',
    page: 'Candidate Session',
    routeTemplate: '/candidate/session/[token]',
    component: 'src/app/(candidate)/candidate/session/[token]/page.tsx',
    group: 'candidateSession',
    storageRole: 'candidate',
    userType: 'candidate',
    interactionPattern: 'Task workspace',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
    ready: async (page) =>
      waitForAnyVisible([
        () =>
          expect(
            page.getByRole('button', { name: /start trial/i }),
          ).toBeVisible({ timeout: 15_000 }),
        () =>
          expect(
            page.getByRole('heading', { name: /day\s*\d/i }).first(),
          ).toBeVisible({ timeout: 15_000 }),
        () =>
          expect(page.locator('textarea').first()).toBeVisible({
            timeout: 15_000,
          }),
      ]),
  },
  {
    id: 'candidate-legacy-redirect',
    page: 'Candidate Legacy Redirect',
    routeTemplate: '/candidate-sessions/[token]',
    component:
      'src/app/(candidate)/(legacy)/candidate-sessions/[token]/page.tsx',
    group: 'candidateSession',
    storageRole: 'candidate',
    userType: 'candidate',
    interactionPattern: 'Legacy redirect + bootstrap',
    complexity: 'medium',
    resolveRoute: (ids) =>
      `/candidate-sessions/${encodeURIComponent(ids.inviteToken)}`,
    ready: async (page, ids) => {
      await page.waitForURL(
        `**/candidate/session/${encodeURIComponent(ids.inviteToken)}`,
      );
      await waitForAnyVisible([
        () =>
          expect(
            page.getByRole('button', { name: /start trial/i }),
          ).toBeVisible({ timeout: 15_000 }),
        () =>
          expect(page.locator('textarea').first()).toBeVisible({
            timeout: 15_000,
          }),
      ]);
    },
  },
];
