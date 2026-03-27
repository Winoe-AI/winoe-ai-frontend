import { friendlyBootstrapError } from '../utils/errorMessages';
import type { InviteInitParams } from './inviteInitRunner.types';

export function handleInviteInitError(params: InviteInitParams, err: unknown) {
  const status = (err as { status?: number }).status;
  if (status === 401) {
    params.markEnd('candidate:init', { status: 'auth_redirect' });
    params.redirectToLogin();
    return;
  }

  if (status === 403) {
    params.setErrorStatus(403);
    params.setErrorMessage(friendlyBootstrapError(err));
    params.setView('accessDenied');
    params.markEnd('candidate:init', { status: 'access_denied' });
    return;
  }

  if (status === 410) {
    params.setErrorStatus(410);
    params.setErrorMessage(friendlyBootstrapError(err));
    params.setView('expired');
    params.markEnd('candidate:init', { status: 'expired' });
    return;
  }

  params.setErrorStatus(status ?? null);
  params.setErrorMessage(friendlyBootstrapError(err));
  params.setView('error');
  params.markEnd('candidate:init', { status: 'error' });
}
