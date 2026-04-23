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
  const inviteErrorStatus = errorStatus ?? 0;
  const inviteLinkError = [400, 404, 409, 410].includes(inviteErrorStatus);
  const errorTitle =
    inviteErrorStatus === 400 || inviteErrorStatus === 404
      ? 'Invalid invite'
      : inviteErrorStatus === 409
        ? 'Invite already claimed'
        : inviteErrorStatus === 410
          ? 'Invite expired'
          : inviteLinkError
            ? 'Invite link unavailable'
            : 'Unable to load trial';
  const errorCopy = inviteLinkError
    ? inviteErrorCopy
    : (errorMessage ?? 'Something went wrong loading your trial.');

  return (
    <ErrorView
      authStatus={authStatus}
      errorStatus={errorStatus}
      errorTitle={errorTitle}
      errorCopy={errorCopy}
      inviteLinkError={inviteLinkError}
      loginHref={props.loginHref}
      onRetry={props.onRetryInit}
      onGoHome={props.onGoHome}
    />
  );
}
