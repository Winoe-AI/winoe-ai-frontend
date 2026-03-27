import { MockNextRequest, MockNextResponse, makeResponse } from './mockNext';

export const requireBffAuthMock = jest.fn();
export const mergeResponseCookiesMock = jest.fn();
export const upstreamRequestMock = jest.fn();
export const parseUpstreamBodyMock = jest.fn();
export const forwardJsonMock = jest.fn();

jest.mock('next/server', () => {
  const { MockNextRequest, MockNextResponse } = jest.requireActual('./mockNext');
  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

jest.mock('@/lib/server/bffAuth', () => ({
  requireBffAuth: (...args: any[]) => requireBffAuthMock(...args),
  mergeResponseCookies: (...args: any[]) => mergeResponseCookiesMock(...args),
}));

jest.mock('@/lib/server/bff', () => ({
  REQUEST_ID_HEADER: 'x-request-id',
  UPSTREAM_HEADER: 'x-upstream',
  getBackendBaseUrl: () => 'http://backend',
  upstreamRequest: (...args: any[]) => upstreamRequestMock(...args),
  parseUpstreamBody: (...args: any[]) => parseUpstreamBodyMock(...args),
  forwardJson: (...args: any[]) => forwardJsonMock(...args),
  resolveRequestId: () => 'req-1',
}));

const originalEnv = { ...process.env };

export const resetRecruiterRouteMocks = () => {
  jest.resetAllMocks();
  jest.resetModules();
  process.env = { ...originalEnv };
  requireBffAuthMock.mockResolvedValue({
    ok: true,
    accessToken: 'token-123',
    cookies: new MockNextResponse(),
    response: new MockNextResponse(null, { status: 401 }),
  });
};

export const restoreRecruiterRouteEnv = () => {
  process.env = originalEnv;
};

export { MockNextRequest, MockNextResponse, makeResponse };
