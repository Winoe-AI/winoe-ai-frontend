import {
  friendlyBootstrapError,
  friendlyClaimError,
  friendlySubmitError,
  friendlyTaskError,
} from '@/features/candidate/session/utils/errorMessagesUtils';
import { HttpError } from '@/features/candidate/session/api';
import {
  INVITE_ALREADY_CLAIMED_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
} from '@/platform/copy/invite';

describe('candidate error messages', () => {
  it('maps bootstrap statuses to friendly messages', () => {
    [
      [400, INVITE_INVALID_MESSAGE],
      [404, INVITE_INVALID_MESSAGE],
      [409, INVITE_ALREADY_CLAIMED_MESSAGE],
      [401, 'sign in'],
      [410, INVITE_EXPIRED_MESSAGE],
    ].forEach(([status, expected]) => {
      expect(
        friendlyBootstrapError(new HttpError(status as number, 'x')),
      ).toContain(expected as string);
    });
    expect(friendlyBootstrapError(new HttpError(403, 'email claim'))).toBe(
      'We could not confirm your sign-in. Please sign in again.',
    );
    expect(friendlyBootstrapError(new HttpError(403, 'forbidden'))).toBe(
      'You do not have access to this invite.',
    );
    expect(friendlyBootstrapError(new Error('Backend fail'))).toContain(
      'Network error',
    );
    expect(friendlyBootstrapError(new HttpError(502, ''))).toBe(
      'Something went wrong loading your trial.',
    );
    expect(
      friendlyBootstrapError({ message: 'Custom bootstrap message' }),
    ).toContain('Network error');
    expect(friendlyBootstrapError(new HttpError(503, '   '))).toBe(
      'Something went wrong loading your trial.',
    );
  });

  it('maps claim errors and defaults', () => {
    expect(friendlyClaimError(new HttpError(401, ''))).toContain('sign in');
    expect(friendlyClaimError(new HttpError(410, 'x'))).toContain('expired');
    expect(friendlyClaimError(new HttpError(403, 'email claim'))).toBe(
      'We could not confirm your sign-in. Please sign in again.',
    );
    expect(friendlyClaimError(new HttpError(403, 'use this'))).toBe(
      'You do not have access to this invite.',
    );
    expect(friendlyClaimError(new HttpError(500, ''))).toContain(
      'Unable to claim',
    );
    expect(friendlyClaimError(new HttpError(400, ''))).toBe(
      INVITE_INVALID_MESSAGE,
    );
    expect(friendlyClaimError(new HttpError(404, ''))).toBe(
      INVITE_INVALID_MESSAGE,
    );
    expect(friendlyClaimError(new HttpError(409, ''))).toBe(
      INVITE_ALREADY_CLAIMED_MESSAGE,
    );
    expect(friendlyClaimError(new HttpError(0, ''))).toContain('Network error');
    expect(friendlyClaimError(new HttpError(502, 'Custom claim error'))).toBe(
      'Custom claim error',
    );
    expect(friendlyClaimError(new HttpError(503, '  '))).toBe(
      'Unable to claim your invite right now. Please try again.',
    );
  });

  it('maps task errors for session mismatch, network, and defaults', () => {
    expect(friendlyTaskError(new HttpError(400, 'x'))).toBe(
      INVITE_INVALID_MESSAGE,
    );
    expect(friendlyTaskError(new HttpError(404, 'x'))).toBe(
      INVITE_INVALID_MESSAGE,
    );
    expect(friendlyTaskError(new HttpError(409, ''))).toBe(
      INVITE_ALREADY_CLAIMED_MESSAGE,
    );
    expect(friendlyTaskError(new HttpError(410, 'x'))).toBe(
      INVITE_EXPIRED_MESSAGE,
    );
    expect(friendlyTaskError(new HttpError(0, 'offline'))).toContain(
      'Network error',
    );
    expect(friendlyTaskError(new HttpError(500, 'Custom task'))).toBe(
      'Custom task',
    );
    expect(friendlyTaskError(new HttpError(502, ''))).toBe(
      'Something went wrong loading your current task.',
    );
    expect(friendlyTaskError(new HttpError(503, '  '))).toBe(
      'Something went wrong loading your current task.',
    );
  });

  it('maps submit errors for order, conflict, and defaults', () => {
    expect(friendlySubmitError(new HttpError(400, 'order'))).toBe(
      'Task out of order.',
    );
    expect(friendlySubmitError(new HttpError(409, 'conflict'))).toBe(
      'Task already submitted.',
    );
    expect(friendlySubmitError(new HttpError(0, ''))).toContain(
      'Network error',
    );
    expect(friendlySubmitError(new HttpError(500, 'specific'))).toBe(
      'specific',
    );
    expect(friendlySubmitError(new HttpError(404, ''))).toBe(
      'Session mismatch. Please reopen your invite link.',
    );
    expect(friendlySubmitError(new HttpError(410, ''))).toBe(
      'That invite link has expired.',
    );
  });
});
