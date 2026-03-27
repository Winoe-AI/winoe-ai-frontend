import { expect } from '@playwright/test';
import { waitForAnyVisible } from '../helpers';
import type { RouteDefinition } from '../types';

export const publicAuthRoutes: RouteDefinition[] = [
  {
    id: 'marketing-home',
    page: 'Marketing Home',
    routeTemplate: '/',
    component: 'src/app/(marketing)/page.tsx',
    group: 'public',
    storageRole: 'none',
    userType: 'public',
    interactionPattern: 'Landing read',
    complexity: 'low',
    resolveRoute: () => '/',
    ready: async (page) =>
      expect(
        page.getByRole('heading', { name: /welcome/i }).first(),
      ).toBeVisible(),
  },
  {
    id: 'auth-login',
    page: 'Auth Login',
    routeTemplate: '/auth/login',
    component: 'src/app/(auth)/auth/login/page.tsx',
    group: 'auth',
    storageRole: 'none',
    userType: 'public',
    interactionPattern: 'Auth gateway',
    complexity: 'low',
    resolveRoute: () => '/auth/login?mode=recruiter',
    ready: async (page) =>
      waitForAnyVisible([
        () =>
          expect(
            page.getByRole('heading', { name: /sign in|recruiter login/i }),
          ).toBeVisible({ timeout: 10_000 }),
        async () =>
          page.waitForURL(/auth0\.com\/u\/login|\/authorize/i, {
            timeout: 10_000,
          }),
      ]),
  },
  {
    id: 'auth-logout',
    page: 'Auth Logout',
    routeTemplate: '/auth/logout',
    component: 'src/app/(auth)/auth/logout/page.tsx',
    group: 'auth',
    storageRole: 'none',
    userType: 'public',
    interactionPattern: 'Auth confirmation',
    complexity: 'low',
    resolveRoute: () => '/auth/logout',
    ready: async (page) =>
      waitForAnyVisible([
        () =>
          expect(page.getByRole('heading', { name: /log out/i })).toBeVisible({
            timeout: 10_000,
          }),
        async () =>
          page.waitForURL(/auth0\.com\/oidc\/logout/i, { timeout: 10_000 }),
      ]),
  },
  {
    id: 'auth-error',
    page: 'Auth Error',
    routeTemplate: '/auth/error',
    component: 'src/app/(auth)/auth/error/page.tsx',
    group: 'auth',
    storageRole: 'none',
    userType: 'public',
    interactionPattern: 'Auth failure',
    complexity: 'low',
    resolveRoute: () => '/auth/error?error=state_mismatch&mode=recruiter',
    ready: async (page) =>
      expect(
        page.getByRole('heading', { name: /sign-in failed/i }),
      ).toBeVisible(),
  },
  {
    id: 'not-authorized',
    page: 'Not Authorized',
    routeTemplate: '/not-authorized',
    component: 'src/app/(auth)/not-authorized/page.tsx',
    group: 'auth',
    storageRole: 'none',
    userType: 'public',
    interactionPattern: 'Access denied state',
    complexity: 'low',
    resolveRoute: () => '/not-authorized?mode=recruiter',
    ready: async (page) =>
      expect(
        page.getByRole('heading', { name: /not authorized/i }),
      ).toBeVisible(),
  },
];
