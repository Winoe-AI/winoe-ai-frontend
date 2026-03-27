import React from 'react';

export const loginMock = jest.fn(
  ({ returnTo, mode }: { returnTo?: string; mode?: string }) => (
    <div data-testid="login-mock">
      {returnTo ?? 'none'}|{mode ?? 'none'}
    </div>
  ),
);
export const logoutMock = jest.fn(() => <div data-testid="logout-mock" />);
export const authErrorMock = jest.fn((props: Record<string, unknown>) => (
  <div data-testid="auth-error-mock">{JSON.stringify(props)}</div>
));

jest.mock('@/features/auth/LoginPage', () => ({
  __esModule: true,
  default: (props: { returnTo?: string; mode?: string }) => loginMock(props),
}));
jest.mock('@/features/auth/LogoutPage', () => ({
  __esModule: true,
  default: () => logoutMock(),
}));
jest.mock('@/features/auth/AuthErrorPage', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => authErrorMock(props),
}));

export const sanitizeReturnToMock = jest.fn(
  (value?: string | null) => value?.trim() || '/',
);
export const modeForPathMock = jest.fn(() => 'candidate');
jest.mock('@/lib/auth/routing', () => ({
  sanitizeReturnTo: sanitizeReturnToMock,
  modeForPath: modeForPathMock,
}));

export function resetAuthPageMocks() {
  jest.clearAllMocks();
}
