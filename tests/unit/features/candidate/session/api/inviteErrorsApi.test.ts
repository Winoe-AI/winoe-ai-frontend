import {
  classifyInviteErrorState,
  extractInviteErrorContact,
} from '@/features/candidate/session/api/inviteErrorsApi';

describe('classifyInviteErrorState', () => {
  it('treats a bare 410 as an expired invite', () => {
    expect(classifyInviteErrorState({ status: 410 })).toBe('expired');
  });

  it('treats explicit termination markers as terminated', () => {
    expect(
      classifyInviteErrorState({
        status: 410,
        details: { trialStatus: 'terminated' },
      }),
    ).toBe('terminated');
  });

  it('treats explicit invite-expired codes as expired', () => {
    expect(
      classifyInviteErrorState({
        status: 410,
        details: { code: 'INVITE_EXPIRED' },
      }),
    ).toBe('expired');
  });

  it('treats invite-invalid codes on 401 responses as invalid', () => {
    expect(
      classifyInviteErrorState({
        status: 401,
        details: { code: 'INVITE_INVALID' },
      }),
    ).toBe('invalid');
  });

  it('treats malformed token validation details on 422 responses as invalid', () => {
    expect(
      classifyInviteErrorState({
        status: 422,
        details: {
          code: 'VALIDATION_ERROR',
          detail: [
            {
              type: 'string_too_short',
              loc: ['path', 'token'],
              msg: 'String should have at least 1 character',
              input: 'not-a-real-token',
            },
          ],
        },
      }),
    ).toBe('invalid');
  });

  it('treats explicit terminated codes as terminated', () => {
    expect(
      classifyInviteErrorState({
        status: 422,
        details: { code: 'TRIAL_TERMINATED' },
      }),
    ).toBe('terminated');
  });

  it('ignores generic root email and name fields for contact extraction', () => {
    expect(
      extractInviteErrorContact({
        details: { email: 'candidate@example.com', name: 'Candidate Name' },
      }),
    ).toEqual({ email: null, name: null });
  });

  it('extracts explicit talent partner contact fields', () => {
    expect(
      extractInviteErrorContact({
        details: {
          talentPartnerEmail: 'tp@example.com',
          talentPartnerName: 'Jordan',
        },
      }),
    ).toEqual({ email: 'tp@example.com', name: 'Jordan' });
  });

  it('extracts generic contact fields when they are nested under contact', () => {
    expect(
      extractInviteErrorContact({
        details: {
          contact: { email: 'tp@example.com', name: 'Jordan' },
        },
      }),
    ).toEqual({ email: 'tp@example.com', name: 'Jordan' });
  });

  it('does not treat generic root contact fields as support contact', () => {
    expect(
      extractInviteErrorContact({
        details: {
          email: 'candidate@example.com',
          name: 'Candidate Name',
        },
      }),
    ).toEqual({ email: null, name: null });
  });
});
