import {
  friendlyBootstrapError,
  friendlyClaimError,
  friendlySubmitError,
  friendlyTaskError,
} from '@/features/candidate/session/utils/errorMessages';
import { HttpError } from '@/features/candidate/api';

describe('candidate error messages', () => {
  it('maps bootstrap statuses to friendly messages', () => {
    [
      [400, 'no longer valid'],
      [404, 'no longer valid'],
      [409, 'no longer valid'],
      [401, 'sign in'],
      [403, 'sign in'],
      [410, 'expired or was already used'],
    ].forEach(([status, expected]) => {
      expect(friendlyBootstrapError(new HttpError(status as number, 'x'))).toContain(expected as string);
    });
    expect(friendlyBootstrapError(new Error('Backend fail'))).toContain('Network error');
    expect(friendlyBootstrapError(new HttpError(502, ''))).toBe('Something went wrong loading your simulation.');
    expect(friendlyBootstrapError({ message: 'Custom bootstrap message' })).toContain('Network error');
    expect(friendlyBootstrapError(new HttpError(503, '   '))).toBe('Something went wrong loading your simulation.');
  });

  it('maps claim errors and defaults', () => {
    expect(friendlyClaimError(new HttpError(401, ''))).toContain('sign in');
    expect(friendlyClaimError(new HttpError(410, 'x'))).toContain('expired');
    expect(friendlyClaimError(new HttpError(403, 'use this'))).toContain('sign in');
    expect(friendlyClaimError(new HttpError(500, ''))).toContain('Unable to claim');
    [400, 404, 409].forEach((status) => {
      expect(friendlyClaimError(new HttpError(status, ''))).toContain('no longer valid');
    });
    expect(friendlyClaimError(new HttpError(0, ''))).toContain('Network error');
    expect(friendlyClaimError(new HttpError(502, 'Custom claim error'))).toBe('Custom claim error');
    expect(friendlyClaimError(new HttpError(503, '  '))).toBe('Unable to claim your invite right now. Please try again.');
  });

  it('maps task errors for session mismatch, network, and defaults', () => {
    expect(friendlyTaskError(new HttpError(400, 'x'))).toContain('no longer valid');
    expect(friendlyTaskError(new HttpError(404, 'x'))).toContain('no longer valid');
    expect(friendlyTaskError(new HttpError(409, ''))).toContain('no longer valid');
    expect(friendlyTaskError(new HttpError(410, 'x'))).toContain('expired');
    expect(friendlyTaskError(new HttpError(0, 'offline'))).toContain('Network error');
    expect(friendlyTaskError(new HttpError(500, 'Custom task'))).toBe('Custom task');
    expect(friendlyTaskError(new HttpError(502, ''))).toBe('Something went wrong loading your current task.');
    expect(friendlyTaskError(new HttpError(503, '  '))).toBe('Something went wrong loading your current task.');
  });

  it('maps submit errors for order, conflict, and defaults', () => {
    expect(friendlySubmitError(new HttpError(400, 'order'))).toBe('Task out of order.');
    expect(friendlySubmitError(new HttpError(409, 'conflict'))).toBe('Task already submitted.');
    expect(friendlySubmitError(new HttpError(0, ''))).toContain('Network error');
    expect(friendlySubmitError(new HttpError(500, 'specific'))).toBe('specific');
    expect(friendlySubmitError(new HttpError(404, ''))).toBe('Session mismatch. Please reopen your invite link.');
    expect(friendlySubmitError(new HttpError(410, ''))).toBe('That invite link has expired.');
  });
});
