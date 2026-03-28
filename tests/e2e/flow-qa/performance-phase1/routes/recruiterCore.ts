import { expect } from '@playwright/test';
import type { RouteDefinition } from '../types';

export const recruiterCoreRoutes: RouteDefinition[] = [
  {
    id: 'recruiter-dashboard',
    page: 'Recruiter Dashboard',
    routeTemplate: '/dashboard',
    component: 'src/app/(recruiter)/dashboard/page.tsx',
    group: 'recruiter',
    storageRole: 'recruiter',
    userType: 'recruiter',
    interactionPattern: 'Overview + list',
    complexity: 'medium',
    resolveRoute: () => '/dashboard',
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible(),
  },
  {
    id: 'recruiter-create',
    page: 'Recruiter Create Simulation',
    routeTemplate: '/dashboard/simulations/new',
    component: 'src/app/(recruiter)/dashboard/simulations/new/page.tsx',
    group: 'recruiter',
    storageRole: 'recruiter',
    userType: 'recruiter',
    interactionPattern: 'Form entry + submit',
    complexity: 'medium',
    resolveRoute: () => '/dashboard/simulations/new',
    ready: async (page) =>
      expect(
        page.getByRole('heading', { name: /new simulation/i }),
      ).toBeVisible(),
  },
  {
    id: 'recruiter-simulation-detail',
    page: 'Recruiter Simulation Detail',
    routeTemplate: '/dashboard/simulations/[id]',
    component: 'src/app/(recruiter)/dashboard/simulations/[id]/page.tsx',
    group: 'recruiter',
    storageRole: 'recruiter',
    userType: 'recruiter',
    interactionPattern: 'Plan + candidates',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}`,
    ready: async (page) =>
      expect(page.getByText(/5-day simulation plan/i)).toBeVisible(),
  },
];
