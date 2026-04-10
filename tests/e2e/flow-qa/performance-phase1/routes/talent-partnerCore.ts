import { expect } from '@playwright/test';
import type { RouteDefinition } from '../types';

export const talentPartnerCoreRoutes: RouteDefinition[] = [
  {
    id: 'talent-partner-dashboard',
    page: 'Talent Partner Dashboard',
    routeTemplate: '/dashboard',
    component: 'src/app/(talent-partner)/dashboard/page.tsx',
    group: 'talent_partner',
    storageRole: 'talent_partner',
    userType: 'talent_partner',
    interactionPattern: 'Overview + list',
    complexity: 'medium',
    resolveRoute: () => '/dashboard',
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible(),
  },
  {
    id: 'talent_partner-create',
    page: 'TalentPartner Create Trial',
    routeTemplate: '/dashboard/trials/new',
    component: 'src/app/(talent-partner)/dashboard/trials/new/page.tsx',
    group: 'talent_partner',
    storageRole: 'talent_partner',
    userType: 'talent_partner',
    interactionPattern: 'Form entry + submit',
    complexity: 'medium',
    resolveRoute: () => '/dashboard/trials/new',
    ready: async (page) =>
      expect(page.getByRole('heading', { name: /new trial/i })).toBeVisible(),
  },
  {
    id: 'talent_partner-trial-detail',
    page: 'TalentPartner Trial Detail',
    routeTemplate: '/dashboard/trials/[id]',
    component: 'src/app/(talent-partner)/dashboard/trials/[id]/page.tsx',
    group: 'talent_partner',
    storageRole: 'talent_partner',
    userType: 'talent_partner',
    interactionPattern: 'Plan + candidates',
    complexity: 'high',
    resolveRoute: (ids) =>
      `/dashboard/trials/${encodeURIComponent(ids.trialId)}`,
    ready: async (page) =>
      expect(page.getByText(/5-day trial plan/i)).toBeVisible(),
  },
];
