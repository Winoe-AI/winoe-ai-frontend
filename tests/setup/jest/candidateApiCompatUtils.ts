export function canCallCompatFn(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  if (typeof value !== 'function') return false;
  const maybeMock = value as {
    _isMockFunction?: boolean;
    getMockImplementation?: () => unknown;
  };
  if (!maybeMock._isMockFunction) return true;
  return (
    typeof maybeMock.getMockImplementation === 'function' &&
    maybeMock.getMockImplementation() != null
  );
}

export const resolveCompat = () => {
  try {
    return jest.requireMock('@/features/candidate/session/api') as Record<
      string,
      unknown
    >;
  } catch {
    return {} as Record<string, unknown>;
  }
};

export const callCompat = (
  actual: Record<string, unknown>,
  name: string,
  args: unknown[],
) => {
  const compat = resolveCompat();
  const fn = compat[name];
  if (canCallCompatFn(fn)) return fn(...args);
  const fallback = actual[name];
  if (typeof fallback === 'function') return fallback(...args);
  return undefined;
};
