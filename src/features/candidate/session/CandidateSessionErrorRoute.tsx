import { ErrorView } from './views/ErrorView';
import type { CandidateSessionViewProps as Props } from './views/types';

type CandidateSessionErrorRouteProps = {
  props: Props;
  authStatus: Props['authStatus'];
  errorMessage: string | null;
  errorStatus: number | null;
  inviteErrorCopy: string;
};

export function CandidateSessionErrorRoute({
  props,
  authStatus,
  errorMessage,
  errorStatus,
  inviteErrorCopy,
}: CandidateSessionErrorRouteProps) {
  const inviteLinkError = [400, 404, 409, 410].includes(errorStatus ?? 0);
  const errorTitle = inviteLinkError
    ? 'Invite link unavailable'
    : 'Unable to load simulation';
  const errorCopy = inviteLinkError
    ? inviteErrorCopy
    : (errorMessage ?? 'Something went wrong loading your simulation.');

  return (
    <ErrorView
      authStatus={authStatus}
      errorTitle={errorTitle}
      errorCopy={errorCopy}
      inviteLinkError={inviteLinkError}
      loginHref={props.loginHref}
      onRetry={props.onRetryInit}
      onGoHome={props.onGoHome}
    />
  );
}
