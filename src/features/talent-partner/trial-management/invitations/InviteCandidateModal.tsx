import { useState } from 'react';
import Button from '@/shared/ui/Button';
import { InviteCandidateForm } from './InviteCandidateForm';
import type { InviteUiState } from './InviteCandidateTypes';
import { copyInviteLink } from '@/features/talent-partner/utils/formattersUtils';

type InviteCandidateModalProps = {
  open: boolean;
  title: string;
  initialName?: string;
  initialEmail?: string;
  state: InviteUiState;
  onClose: () => void;
  onSubmit: (candidateName: string, inviteEmail: string) => void;
};

export function InviteCandidateModal({
  open,
  title,
  initialName,
  initialEmail,
  state,
  onClose,
  onSubmit,
}: InviteCandidateModalProps) {
  if (!open) return null;

  const resetKey = `${initialName ?? ''}::${initialEmail ?? ''}`;
  const inviteUrl = 'inviteUrl' in state ? (state.inviteUrl?.trim() ?? '') : '';
  const showResult = state.status === 'success' || state.status === 'warning';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Invite candidate</h3>
            <p className="mt-1 text-sm text-gray-600">{title}</p>
          </div>
          <button
            type="button"
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {showResult ? (
          <InviteCandidateSuccess
            key={resetKey}
            state={state}
            inviteUrl={inviteUrl}
            onClose={onClose}
          />
        ) : (
          <div className="mt-4 space-y-4">
            <InviteCandidateForm
              key={resetKey}
              initialName={initialName}
              initialEmail={initialEmail}
              state={state}
              onCancel={onClose}
              onSubmit={onSubmit}
            />
            {state.status === 'error' && inviteUrl ? (
              <InviteUrlPanel inviteUrl={inviteUrl} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function InviteCandidateSuccess({
  state,
  inviteUrl,
  onClose,
}: {
  state: Extract<InviteUiState, { status: 'success' | 'warning' }>;
  inviteUrl: string;
  onClose: () => void;
}) {
  const candidateLabel = state.candidateName
    ? `${state.candidateName} (${state.candidateEmail ?? 'unknown email'})`
    : (state.candidateEmail ?? 'candidate');
  const isConfirmed = state.status === 'success';
  const bannerToneClasses = isConfirmed
    ? 'border-green-200 bg-green-50'
    : 'border-amber-200 bg-amber-50';
  const titleClasses = isConfirmed ? 'text-green-800' : 'text-amber-800';
  const bodyClasses = isConfirmed ? 'text-green-700' : 'text-amber-700';
  const title = isConfirmed ? 'Invite sent' : 'Invite link created';

  return (
    <div className="mt-4 space-y-4" data-testid="invite-success">
      <div className={`rounded border p-4 ${bannerToneClasses}`}>
        <p className={`text-sm font-semibold ${titleClasses}`}>{title}</p>
        <p className={`mt-1 text-sm ${bodyClasses}`}>
          {state.message ?? `Sent to ${candidateLabel}.`}
        </p>
      </div>

      {inviteUrl ? <InviteUrlPanel inviteUrl={inviteUrl} /> : null}

      <div className="flex justify-end">
        <Button type="button" onClick={onClose} variant="secondary">
          Done
        </Button>
      </div>
    </div>
  );
}

function InviteUrlPanel({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = async () => {
    const ok = await copyInviteLink(inviteUrl);
    setCopied(ok);
    setCopyError(
      ok
        ? null
        : 'Unable to copy automatically. Select the URL and copy it manually.',
    );
  };

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-4">
      <div className="text-sm font-medium text-gray-900">Invite URL</div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-700"
          readOnly
          value={inviteUrl}
          aria-label="Invite URL"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          disabled={!inviteUrl}
        >
          {copied ? 'Copied' : 'Copy invite URL'}
        </Button>
      </div>
      {copyError ? (
        <p className="mt-2 text-xs text-red-600">{copyError}</p>
      ) : null}
    </div>
  );
}
