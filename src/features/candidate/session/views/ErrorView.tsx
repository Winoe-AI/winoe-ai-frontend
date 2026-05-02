import Button from '@/shared/ui/Button';
import { buildInviteErrorViewModel } from './inviteErrorViewModel';
import { StateMessage } from '../components/StateMessage';
import type { InviteErrorState } from '../api/inviteErrorsApi';

type Props = {
  inviteErrorState: InviteErrorState | null;
  inviteContactName: string | null;
  inviteContactEmail: string | null;
  loginHref: string;
  onDashboard: () => void;
  onRetry: () => void;
};

export function ErrorView({
  loginHref,
  inviteErrorState,
  inviteContactName,
  inviteContactEmail,
  onDashboard,
  onRetry,
}: Props) {
  const model = buildInviteErrorViewModel({
    inviteErrorState,
    inviteContactName,
    inviteContactEmail,
    loginHref,
  });
  const action =
    model.ctaAction === 'retry' ? (
      <div className="flex gap-3">
        <Button onClick={onRetry}>{model.ctaLabel}</Button>
      </div>
    ) : model.ctaAction === 'dashboard' ? (
      <div className="flex gap-3">
        <Button onClick={onDashboard}>{model.ctaLabel}</Button>
      </div>
    ) : (
      <div className="flex gap-3">
        <a href={model.ctaHref ?? loginHref}>
          <Button>{model.ctaLabel}</Button>
        </a>
      </div>
    );

  return (
    <StateMessage
      title={model.title}
      description={model.description}
      action={action}
    />
  );
}
