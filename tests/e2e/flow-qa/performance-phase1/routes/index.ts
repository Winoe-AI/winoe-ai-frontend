import type { RouteDefinition } from '../types';
import { candidateBasicRoutes } from './candidateBasic';
import { candidateSessionRoutes } from './candidateSession';
import { publicAuthRoutes } from './publicAuth';
import { recruiterCandidateRoutes } from './recruiterCandidates';
import { recruiterCoreRoutes } from './recruiterCore';

export function routeDefinitions(): RouteDefinition[] {
  return [
    ...publicAuthRoutes,
    ...candidateBasicRoutes,
    ...candidateSessionRoutes,
    ...recruiterCoreRoutes,
    ...recruiterCandidateRoutes,
  ];
}
