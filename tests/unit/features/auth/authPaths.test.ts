import {
  buildAuthStartHref,
  buildTalentPartnerOnboardingHref,
  buildLoginHref,
  buildSignupHref,
  buildLogoutHref,
  buildClearAuthHref,
  modeForPath,
} from '@/features/auth/authPaths';

const originalEnv = { ...process.env };

describe('authPaths helpers', () => {
  beforeEach(() => {
    Object.assign(process.env, originalEnv, {
      NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION: 'cand-conn',
      NEXT_PUBLIC_WINOE_AUTH0_TALENT_PARTNER_CONNECTION: 'talent-partner-conn',
      NEXT_PUBLIC_WINOE_APP_BASE_URL: 'https://app.winoe.dev',
      NEXT_PUBLIC_VERCEL_URL: '',
    });
  });

  afterAll(() => {
    Object.assign(process.env, originalEnv);
  });

  it('builds login href with mode without the Auth0 connection', () => {
    const href = buildLoginHref('/dest', 'candidate');
    expect(href).toContain('mode=candidate');
    expect(href).toContain('returnTo=%2Fdest');
    expect(href).not.toContain('connection=');
  });

  it('defaults login mode to talent_partner and omits connection when unset', () => {
    delete process.env.NEXT_PUBLIC_WINOE_AUTH0_TALENT_PARTNER_CONNECTION;
    const href = buildLoginHref();
    expect(href).toBe('/auth/login?returnTo=%2F&mode=talent_partner');
  });

  it('builds auth start href with mode and connection', () => {
    const href = buildAuthStartHref('/dest', 'candidate');
    expect(href).toContain('/auth/start?');
    expect(href).toContain('mode=candidate');
    expect(href).toContain('returnTo=%2Fdest');
    expect(href).toContain('connection=cand-conn');
  });

  it('builds signup href with screen hint', () => {
    const href = buildSignupHref('/home', 'talent_partner');
    expect(href).toContain('/auth/start?');
    expect(href).toContain('screen_hint=signup');
    expect(href).toContain('connection=talent-partner-conn');
  });

  it('builds talent partner onboarding href with sanitized return path', () => {
    expect(buildTalentPartnerOnboardingHref('/dashboard/trials/new')).toBe(
      '/talent-partner-onboarding?returnTo=%2Fdashboard%2Ftrials%2Fnew',
    );
  });

  it('builds logout href with absolute returnTo and strips hash/query', () => {
    const href = buildLogoutHref('/candidate/dashboard#hash?x=1');
    expect(href).toBe(
      '/auth/logout?returnTo=http%3A%2F%2Flocalhost%2Fcandidate%2Fdashboard',
    );
  });

  it('falls back to base logout when origin cannot be resolved', () => {
    delete process.env.NEXT_PUBLIC_WINOE_APP_BASE_URL;
    const globalWithWindow = globalThis as { window?: unknown };
    delete globalWithWindow.window;
    const href = buildLogoutHref('/any');
    expect(href).toBe('/auth/logout');
  });

  it('uses vercel url fallback when app base missing', () => {
    delete process.env.NEXT_PUBLIC_WINOE_APP_BASE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = 'example.vercel.app';
    const href = buildLogoutHref('/candidate/dashboard');
    expect(href).toBe(
      '/auth/logout?returnTo=https%3A%2F%2Fexample.vercel.app%2Fcandidate%2Fdashboard',
    );
  });

  it('omits connection when candidate connection not set', () => {
    delete process.env.NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION;
    const href = buildAuthStartHref('/dest', 'candidate');
    expect(href).toBe('/auth/start?returnTo=%2Fdest&mode=candidate');
  });

  it('returns base login when no returnTo provided and talent_partner mode default', () => {
    delete process.env.NEXT_PUBLIC_WINOE_AUTH0_TALENT_PARTNER_CONNECTION;
    const href = buildLoginHref(undefined, undefined);
    expect(href).toBe('/auth/login?returnTo=%2F&mode=talent_partner');
  });

  it('builds clear auth href with optional mode', () => {
    expect(buildClearAuthHref('/back')).toBe('/auth/clear?returnTo=%2Fback');
    expect(buildClearAuthHref('/back', 'candidate')).toBe(
      '/auth/clear?returnTo=%2Fback&mode=candidate',
    );
  });

  it('derives mode from path segments', () => {
    expect(modeForPath('/candidate/session/abc')).toBe('candidate');
    expect(modeForPath('/dashboard')).toBe('talent_partner');
    expect(modeForPath('/unknown')).toBe('talent_partner');
  });
});
