import type { RouteDefinition } from './types';

export function buildPageInventory(routes: RouteDefinition[]) {
  return {
    generatedAt: new Date().toISOString(),
    routes: routes.map((route) => ({
      routeId: route.id,
      page: route.page,
      routeTemplate: route.routeTemplate,
      component: route.component,
      group: route.group,
      storageRole: route.storageRole,
      userType: route.userType,
      interactionPattern: route.interactionPattern,
      complexity: route.complexity,
    })),
  };
}
