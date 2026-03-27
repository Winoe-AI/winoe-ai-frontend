import { MUTATION_HINT_SEGMENTS } from './requestSecurity.constants';

export function normalizePath(pathSegments: string[]) {
  return pathSegments
    .map((segment) => {
      try {
        return decodeURIComponent(segment).toLowerCase();
      } catch {
        return segment.toLowerCase();
      }
    })
    .join('/');
}

export function isLikelyMutationGet(path: string): boolean {
  return path
    .split('/')
    .some((segment) => MUTATION_HINT_SEGMENTS.has(segment.toLowerCase()));
}
