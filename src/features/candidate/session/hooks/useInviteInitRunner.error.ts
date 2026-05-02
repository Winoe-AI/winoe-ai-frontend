import {
  classifyInviteErrorState,
  extractInviteErrorContact,
  type InviteErrorState,
} from '@/features/candidate/session/api/inviteErrorsApi';
import {
  INVITE_ALREADY_CLAIMED_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
  INVITE_TERMINATED_MESSAGE,
  INVITE_UNAVAILABLE_MESSAGE,
} from '@/platform/copy/invite';
import type { InviteInitParams } from './useInviteInitRunner.types';

export function handleInviteInitError(params: InviteInitParams, err: unknown) {
  const status = (err as { status?: number }).status;
  const inviteErrorState =
    (err as { inviteErrorState?: InviteErrorState }).inviteErrorState ??
    classifyInviteErrorState(err);
  const inviteContact = extractInviteErrorContact(err);

  if (inviteErrorState === 'terminated') {
    params.setInviteErrorState(inviteErrorState);
    params.setInviteContactName(inviteContact.name);
    params.setInviteContactEmail(inviteContact.email);
    params.setErrorStatus(status ?? 410);
    params.setErrorMessage(INVITE_TERMINATED_MESSAGE);
    params.setView('error');
    params.markEnd('candidate:init', {
      status: 'error',
      inviteErrorState,
    });
    return;
  }

  if (inviteErrorState === 'invalid') {
    params.setInviteErrorState(inviteErrorState);
    params.setInviteContactName(inviteContact.name);
    params.setInviteContactEmail(inviteContact.email);
    params.setErrorStatus(status ?? 400);
    params.setErrorMessage(INVITE_INVALID_MESSAGE);
    params.setView('error');
    params.markEnd('candidate:init', {
      status: 'error',
      inviteErrorState,
    });
    return;
  }

  if (inviteErrorState === 'already_claimed') {
    params.setInviteErrorState(inviteErrorState);
    params.setInviteContactName(inviteContact.name);
    params.setInviteContactEmail(inviteContact.email);
    params.setErrorStatus(status ?? 409);
    params.setErrorMessage(INVITE_ALREADY_CLAIMED_MESSAGE);
    params.setAuthMessage(null);
    params.setView('error');
    params.markEnd('candidate:init', {
      status: 'already_claimed',
      inviteErrorState,
    });
    return;
  }

  if (inviteErrorState === 'expired' || status === 410) {
    params.setInviteErrorState(inviteErrorState);
    params.setInviteContactName(inviteContact.name);
    params.setInviteContactEmail(inviteContact.email);
    params.setErrorStatus(typeof status === 'number' ? status : 410);
    params.setErrorMessage(INVITE_EXPIRED_MESSAGE);
    params.setView('expired');
    params.markEnd('candidate:init', {
      status: 'expired',
      inviteErrorState,
    });
    return;
  }

  if (status === 409) {
    params.setErrorStatus(409);
    params.setErrorMessage(INVITE_ALREADY_CLAIMED_MESSAGE);
    params.setAuthMessage(null);
    params.setInviteErrorState('already_claimed');
    params.setView('error');
    params.markEnd('candidate:init', { status: 'already_claimed' });
    return;
  }

  if (status === 401) {
    if (params.authStatus !== 'unauthenticated') {
      params.setInviteErrorState('invalid');
      params.setInviteContactName(inviteContact.name);
      params.setInviteContactEmail(inviteContact.email);
      params.setErrorStatus(401);
      params.setErrorMessage(INVITE_INVALID_MESSAGE);
      params.setAuthMessage(null);
      params.setView('error');
      params.markEnd('candidate:init', {
        status: 'error',
        inviteErrorState: 'invalid',
      });
      return;
    }
    params.markEnd('candidate:init', { status: 'auth_redirect' });
    params.redirectToLogin();
    return;
  }

  if (status === 403) {
    params.setErrorStatus(403);
    const backendMessage = (err as { message?: string }).message ?? '';
    params.setErrorMessage(
      backendMessage.toLowerCase().includes('email')
        ? 'We could not confirm your sign-in. Please sign in again.'
        : 'You do not have access to this invite.',
    );
    params.setView('accessDenied');
    params.markEnd('candidate:init', { status: 'access_denied' });
    return;
  }

  params.setErrorStatus(status ?? null);
  params.setErrorMessage(INVITE_UNAVAILABLE_MESSAGE);
  params.setView('error');
  params.markEnd('candidate:init', {
    status: 'error',
    inviteErrorState,
  });
}
