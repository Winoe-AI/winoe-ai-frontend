import type { RouteDefinition } from '../types';
import { candidateBasicRoutes } from './candidateBasic';
import { candidateSessionRoutes } from './candidateSession';
import { publicAuthRoutes } from './publicAuth';
import { talentPartnerCandidateRoutes } from './talent-partnerCandidates';
import { talentPartnerCoreRoutes } from './talent-partnerCore';

export function routeDefinitions(): RouteDefinition[] {
  return [
    ...publicAuthRoutes,
    ...candidateBasicRoutes,
    ...candidateSessionRoutes,
    ...talentPartnerCoreRoutes,
    ...talentPartnerCandidateRoutes,
  ];
}
