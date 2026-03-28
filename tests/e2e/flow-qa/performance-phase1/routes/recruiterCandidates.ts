import { expect } from '@playwright/test';
import type { RouteDefinition } from '../types';

export const recruiterCandidateRoutes: RouteDefinition[] = [
  {
    id: 'recruiter-candidate-submissions',
    page: 'Recruiter Candidate Submissions',
    routeTemplate:
      '/dashboard/simulations/[id]/candidates/[candidateSessionId]',
    component:
      'src/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/page.tsx',
    group: 'recruiter',
    storageRole: 'recruiter',
    userType: 'recruiter',
    interactionPattern: 'Artifacts review',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}`,
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /submissions/i })).toBeVisible(),
  },
  {
    id: 'recruiter-fit-profile',
    page: 'Recruiter Candidate Fit Profile',
    routeTemplate:
      '/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile',
    component:
      'src/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile/page.tsx',
    group: 'recruiter',
    storageRole: 'recruiter',
    userType: 'recruiter',
    interactionPattern: 'Fit profile report',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/simulations/${encodeURIComponent(ids.simulationId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}/fit-profile`,
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /fit profile/i })).toBeVisible(),
  },
];
