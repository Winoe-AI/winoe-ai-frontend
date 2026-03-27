import React from 'react';

jest.mock('@/features/candidate/dashboard/CandidateDashboardPage', () => ({
  __esModule: true,
  default: (props: { signedInEmail: string | null }) => (
    <div data-testid="candidate-dashboard" data-signed-email={props.signedInEmail ?? ''} />
  ),
}));

jest.mock('@/features/recruiter/dashboard/RecruiterDashboardView', () => ({
  __esModule: true,
  default: () => <div data-testid="recruiter-dashboard" />,
}));
jest.mock('@/features/recruiter/dashboard/RecruiterDashboardPage', () => ({
  __esModule: true,
  default: () => <div data-testid="recruiter-dashboard" />,
}));
jest.mock('@/features/recruiter/simulations/create/SimulationCreatePage', () => ({
  __esModule: true,
  default: () => <div data-testid="simulation-create" />,
}));
jest.mock('@/features/auth/LoginPage', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page" />,
}));
jest.mock('@/features/auth/LogoutPage', () => ({
  __esModule: true,
  default: () => <div data-testid="logout-page" />,
}));
jest.mock('@/features/auth/AuthErrorPage', () => ({
  __esModule: true,
  default: () => <div data-testid="auth-error-page" />,
}));
jest.mock('@/features/candidate/session/CandidateSessionPage', () => ({
  __esModule: true,
  default: (props: { token: string }) => <div data-testid="candidate-session-page" {...props} />,
}));
jest.mock('@/features/recruiter/simulations/candidates/CandidateSubmissionsPage', () => ({
  __esModule: true,
  default: () => <div data-testid="candidate-submissions-page" />,
}));
jest.mock('@/lib/auth0', () => ({
  getCachedSessionNormalized: jest.fn(async () => ({ user: { email: 'user@example.com' } })),
}));
jest.mock('@/app/(candidate)/(legacy)/candidate-sessions/token-params', () => ({
  requireCandidateToken: jest.fn(async (params: { token: string }) => params.token),
}));
