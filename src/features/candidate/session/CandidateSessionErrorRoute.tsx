import { ErrorView } from './views/ErrorView';
import type { CandidateSessionViewProps as Props } from './views/types';

type CandidateSessionErrorRouteProps = {
  props: Props;
};

export function CandidateSessionErrorRoute({
  props,
}: CandidateSessionErrorRouteProps) {
  return (
    <ErrorView
      inviteErrorState={props.inviteErrorState}
      inviteContactName={props.inviteContactName}
      inviteContactEmail={props.inviteContactEmail}
      loginHref={props.loginHref}
      onDashboard={props.onDashboard}
      onRetry={props.onRetryInit}
    />
  );
}
