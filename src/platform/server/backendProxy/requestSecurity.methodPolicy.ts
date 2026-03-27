import { METHOD_RULES } from './requestSecurity.constants';
import { isLikelyMutationGet, normalizePath } from './requestSecurity.path';
import { methodNotAllowed } from './requestSecurity.responses';
import type { ProxyMethod } from './requestSecurity.types';

export function enforceProxyMethodPolicy(
  method: string,
  pathSegments: string[],
  requestId: string,
) {
  const normalizedMethod = method.toUpperCase() as ProxyMethod;
  const path = normalizePath(pathSegments);
  const rule = METHOD_RULES.find((candidate) => candidate.pattern.test(path));

  if (rule && !rule.methods.includes(normalizedMethod)) {
    return methodNotAllowed(rule.methods, requestId);
  }
  if (!rule && normalizedMethod === 'GET' && isLikelyMutationGet(path)) {
    return methodNotAllowed(['POST', 'PUT', 'PATCH', 'DELETE'], requestId);
  }
  return null;
}
