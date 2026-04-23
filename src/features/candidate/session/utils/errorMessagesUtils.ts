import { HttpError } from '@/platform/api-client/errors/errors';
import {
  INVITE_ALREADY_CLAIMED_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
} from '@/platform/copy/invite';
import { toUserMessage } from '@/platform/errors/errors';

function statusFromUnknown(err: unknown): number | undefined {
  if (typeof HttpError === 'function' && err instanceof HttpError)
    return err.status;
  const anyErr = err as { status?: unknown } | undefined;
  return typeof anyErr?.status === 'number' ? anyErr.status : undefined;
}

function messageFromUnknown(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  const anyErr = err as { message?: unknown } | undefined;
  return typeof anyErr?.message === 'string' ? anyErr.message : undefined;
}

export function friendlyBootstrapError(err: unknown): string {
  const status = statusFromUnknown(err);
  const message = messageFromUnknown(err);
  const lowerMsg = message?.toLowerCase() ?? '';

  if (status === 400 || status === 404) return INVITE_INVALID_MESSAGE;
  if (status === 409) return INVITE_ALREADY_CLAIMED_MESSAGE;
  if (status === 401) return 'Please sign in again.';
  if (status === 403) {
    return lowerMsg.includes('email')
      ? 'We could not confirm your sign-in. Please sign in again.'
      : 'You do not have access to this invite.';
  }
  if (status === 410) return INVITE_EXPIRED_MESSAGE;
  if (!status || status === 0)
    return 'Network error. Please check your connection and try again.';

  if (message && message.trim().length > 0) return message;

  return 'Something went wrong loading your trial.';
}

export function friendlyTaskError(err: unknown): string {
  const status = statusFromUnknown(err);
  const message = messageFromUnknown(err);

  if (status === 400 || status === 404) return INVITE_INVALID_MESSAGE;
  if (status === 409) return INVITE_ALREADY_CLAIMED_MESSAGE;
  if (status === 410) return INVITE_EXPIRED_MESSAGE;
  if (!status || status === 0)
    return 'Network error. Please check your connection and try again.';

  if (message && message.trim().length > 0) return message;

  return 'Something went wrong loading your current task.';
}

export function friendlyClaimError(err: unknown): string {
  const status = statusFromUnknown(err);
  const message = messageFromUnknown(err);
  const lowerMsg = message?.toLowerCase() ?? '';

  if (status === 400 || status === 404) return INVITE_INVALID_MESSAGE;
  if (status === 409) return INVITE_ALREADY_CLAIMED_MESSAGE;
  if (status === 410) return INVITE_EXPIRED_MESSAGE;
  if (status === 401) return 'Please sign in again.';
  if (status === 403) {
    return lowerMsg.includes('email')
      ? 'We could not confirm your sign-in. Please sign in again.'
      : 'You do not have access to this invite.';
  }
  if (!status || status === 0)
    return 'Network error. Please check your connection and try again.';

  if (message && message.trim().length > 0) return message;

  return 'Unable to claim your invite right now. Please try again.';
}

export function friendlySubmitError(err: unknown): string {
  const status = statusFromUnknown(err);

  if (status === 400) return 'Task out of order.';
  if (status === 409) return 'Task already submitted.';
  if (status === 404)
    return 'Session mismatch. Please reopen your invite link.';
  if (status === 410) return 'That invite link has expired.';
  if (!status || status === 0)
    return 'Network error. Please check your connection and try again.';

  return toUserMessage(err, 'Something went wrong submitting your task.');
}
