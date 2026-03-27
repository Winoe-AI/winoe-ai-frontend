import { expect } from '@playwright/test';
import type { RouteDefinition } from '../types';

export const candidateBasicRoutes: RouteDefinition[] = [
  {
    id: 'candidate-dashboard', page: 'Candidate Dashboard', routeTemplate: '/candidate/dashboard', component: 'src/app/(candidate)/candidate/dashboard/page.tsx', group: 'candidateDashboard', storageRole: 'candidate', userType: 'candidate', interactionPattern: 'List + continue entry', complexity: 'medium',
    resolveRoute: () => '/candidate/dashboard',
    ready: async (page) => expect(page.getByRole('heading', { name: /candidate dashboard/i })).toBeVisible(),
  },
  {
    id: 'candidate-what-we-evaluate', page: 'Candidate What We Evaluate', routeTemplate: '/candidate/what-we-evaluate', component: 'src/app/(candidate)/candidate/what-we-evaluate/page.tsx', group: 'candidateDashboard', storageRole: 'candidate', userType: 'candidate', interactionPattern: 'Static guidance read', complexity: 'low',
    resolveRoute: () => '/candidate/what-we-evaluate',
    ready: async (page) => expect(page.getByRole('heading', { name: /what we evaluate/i })).toBeVisible(),
  },
];
