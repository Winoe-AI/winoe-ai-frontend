import { expect } from '@playwright/test';
import type { RouteDefinition } from '../types';

export const talentPartnerCandidateRoutes: RouteDefinition[] = [
  {
    id: 'talent_partner-candidate-submissions',
    page: 'TalentPartner Candidate Submissions',
    routeTemplate: '/dashboard/trials/[id]/candidates/[candidateSessionId]',
    component:
      'src/app/(talent-partner)/dashboard/trials/[id]/candidates/[candidateSessionId]/page.tsx',
    group: 'talent_partner',
    storageRole: 'talent_partner',
    userType: 'talent_partner',
    interactionPattern: 'Artifacts review',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/trials/${encodeURIComponent(ids.trialId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}`,
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /submissions/i })).toBeVisible(),
  },
  {
    id: 'talent_partner-winoe-report',
    page: 'TalentPartner Candidate Winoe Report',
    routeTemplate:
      '/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report',
    component:
      'src/app/(talent-partner)/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report/page.tsx',
    group: 'talent_partner',
    storageRole: 'talent_partner',
    userType: 'talent_partner',
    interactionPattern: 'Winoe Report report',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/trials/${encodeURIComponent(ids.trialId)}/candidates/${encodeURIComponent(ids.candidateSessionId)}/winoe-report`,
    ready: async (page) =>
      expect(
        page.getByRole('heading', { name: /winoe report/i }),
      ).toBeVisible(),
  },
];
