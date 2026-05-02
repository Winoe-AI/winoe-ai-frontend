import { extractInviteErrorContact } from '@/features/candidate/session/api/inviteErrorsApi';
import { buildInviteErrorViewModel } from '@/features/candidate/session/views/inviteErrorViewModel';

describe('buildInviteErrorViewModel', () => {
  it('shows support-first recovery for invalid invites', () => {
    const model = buildInviteErrorViewModel({
      inviteErrorState: 'invalid',
      inviteContactName: null,
      inviteContactEmail: null,
      loginHref: '/auth/login?mode=candidate',
    });

    expect(model.title).toBe('This invite link is invalid');
    expect(model.description).toContain('Winoe AI support');
    expect(model.ctaLabel).toBe('Email support');
    expect(model.ctaHref).toBe('mailto:support@winoe.ai');
    expect(model.ctaAction).toBe('link');
  });

  it('falls back to a generic retryable model for unknown errors', () => {
    const model = buildInviteErrorViewModel({
      inviteErrorState: null,
      inviteContactName: null,
      inviteContactEmail: null,
      loginHref: '/auth/login?mode=candidate',
    });

    expect(model.title).toBe('Unable to load trial');
    expect(model.description).toContain('candidate portal');
    expect(model.ctaLabel).toBe('Retry');
    expect(model.ctaAction).toBe('retry');
  });

  it('uses the candidate portal CTA for expired invites without scoped contact details', () => {
    const model = buildInviteErrorViewModel({
      inviteErrorState: 'expired',
      inviteContactName: null,
      inviteContactEmail: null,
      loginHref: '/auth/login?mode=candidate',
    });

    expect(model.ctaLabel).toBe('Go to candidate portal');
    expect(model.ctaHref).toBeNull();
    expect(model.ctaAction).toBe('dashboard');
  });

  it('falls back to the candidate portal when generic root invite fields look like candidate data', () => {
    const contact = extractInviteErrorContact({
      details: {
        email: 'candidate@example.com',
        name: 'Candidate Name',
      },
    });
    const model = buildInviteErrorViewModel({
      inviteErrorState: 'expired',
      inviteContactName: contact.name,
      inviteContactEmail: contact.email,
      loginHref: '/auth/login?mode=candidate',
    });

    expect(contact).toEqual({ email: null, name: null });
    expect(model.ctaLabel).toBe('Go to candidate portal');
    expect(model.ctaHref).toBeNull();
    expect(model.ctaAction).toBe('dashboard');
  });
});
