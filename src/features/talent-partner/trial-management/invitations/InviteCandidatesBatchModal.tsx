'use client';

import { useMemo, useState } from 'react';
import Button from '@/shared/ui/Button';
import { InviteInputField } from './InviteInputField';
import type { InviteBatchUiState } from './InviteBatchCandidateTypes';
import type { InviteCandidateRow } from './InviteBatchCandidateTypes';
import { copyInviteLink } from '@/features/talent-partner/utils/formattersUtils';

export function formatInviteBatchFailureMessage(raw: string): string {
  const m = raw.trim();
  if (!m) return m;
  if (/api\.github\.com/i.test(m) || /GitHub API error/i.test(m)) {
    return 'We could not finish preparing this candidate workspace. The invite was not sent. Please try again, or check the GitHub workspace configuration.';
  }
  if (
    /sqlalchemy|asyncpg|ProgrammingError|UndefinedColumn|UndefinedTable/i.test(
      m,
    ) ||
    /\[SQL:/i.test(m)
  ) {
    return 'Something went wrong on our side while preparing this invite. Please try again in a moment. If this keeps happening, contact support.';
  }
  return m;
}

type Props = {
  open: boolean;
  title: string;
  state: InviteBatchUiState;
  onClose: () => void;
  onSubmit: (rows: InviteCandidateRow[]) => void;
};

export function InviteCandidatesBatchModal({
  open,
  title,
  state,
  onClose,
  onSubmit,
}: Props) {
  const [rows, setRows] = useState<InviteCandidateRow[]>([
    { name: '', email: '' },
  ]);

  const validation = useMemo(() => {
    const errors: Record<number, { name?: string; email?: string }> = {};
    const emails = new Set<string>();
    rows.forEach((row, idx) => {
      const name = row.name.trim();
      const email = row.email.trim().toLowerCase();
      if (!name)
        errors[idx] = { ...errors[idx], name: 'Full name is required.' };
      if (!email) {
        errors[idx] = { ...errors[idx], email: 'Email is required.' };
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors[idx] = { ...errors[idx], email: 'Enter a valid email address.' };
      } else if (emails.has(email)) {
        errors[idx] = {
          ...errors[idx],
          email: 'Duplicate email in this list.',
        };
      } else {
        emails.add(email);
      }
    });
    return { errors, ok: Object.keys(errors).length === 0 };
  }, [rows]);

  if (!open) return null;

  const disabled = state.status === 'loading';
  const submitDisabled =
    disabled ||
    !validation.ok ||
    rows.every((r) => !r.name.trim() && !r.email.trim());

  const addRow = () => setRows((prev) => [...prev, { name: '', email: '' }]);

  const updateRow = (index: number, patch: Partial<InviteCandidateRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  if (state.status === 'success') {
    const sent = state.invites.filter((i) => i.status !== 'failed');
    const failed = state.invites.filter((i) => i.status === 'failed');
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        data-testid="invite-batch-success"
        aria-labelledby="invite-batch-success-title"
      >
        <div
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-subtle bg-elevated p-6 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                id="invite-batch-success-title"
                className="text-lg font-semibold text-primary"
              >
                Invite results
              </h3>
              <p className="mt-1 text-sm text-secondary">{title}</p>
            </div>
            <button
              type="button"
              className="rounded p-2 text-secondary hover:bg-secondary"
              onClick={onClose}
              aria-label="Close invite results"
            >
              ✕
            </button>
          </div>
          <p className="mt-4 text-sm text-secondary" aria-live="polite">
            {state.message}
          </p>
          {sent.length ? (
            <ul className="mt-4 space-y-3" aria-label="Successful invites">
              {sent.map((inv, idx) => (
                <li
                  key={`${inv.email}-ok-${idx}`}
                  className="rounded border border-subtle p-3 text-sm"
                >
                  <div className="font-medium text-primary">{inv.name}</div>
                  <div className="text-secondary">{inv.email}</div>
                  {inv.workspaceProvisioningNotice ? (
                    <p
                      className="mt-2 text-xs text-amber-900"
                      data-testid="invite-workspace-provisioning-notice"
                    >
                      {inv.workspaceProvisioningNotice}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      className="min-w-0 flex-1 rounded border border-subtle bg-secondary px-2 py-1 font-mono text-xs text-primary"
                      readOnly
                      value={inv.inviteUrl}
                      aria-label={`Invite URL for ${inv.email}`}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void copyInviteLink(inv.inviteUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {failed.length ? (
            <div className="mt-6" role="region" aria-label="Failed invites">
              <h4 className="text-sm font-semibold text-primary">
                Could not send ({failed.length})
              </h4>
              <ul className="mt-2 space-y-2">
                {failed.map((inv, idx) => (
                  <li
                    key={`${inv.email}-fail-${idx}`}
                    className="rounded border border-subtle bg-secondary p-3 text-sm"
                  >
                    <div className="font-medium text-primary">{inv.name}</div>
                    <div className="text-secondary">{inv.email}</div>
                    {inv.errorMessage ? (
                      <p
                        className="mt-2 text-xs text-secondary"
                        id={`invite-fail-msg-${idx}`}
                      >
                        {formatInviteBatchFailureMessage(inv.errorMessage)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-batch-form-title"
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-subtle bg-elevated p-6 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="invite-batch-form-title"
              className="text-lg font-semibold text-primary"
            >
              Invite candidates
            </h3>
            <p className="mt-1 text-sm text-secondary">{title}</p>
          </div>
          <button
            type="button"
            className="rounded p-2 text-secondary hover:bg-secondary"
            onClick={onClose}
            aria-label="Close invite form"
          >
            ✕
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitDisabled) onSubmit(rows);
          }}
        >
          {rows.map((row, idx) => (
            <fieldset
              key={idx}
              className="grid gap-3 border-b border-subtle pb-4 sm:grid-cols-2"
              aria-labelledby={`invite-row-legend-${idx}`}
            >
              <legend
                id={`invite-row-legend-${idx}`}
                className="sr-only sm:col-span-2"
              >
                Candidate row {idx + 1}
              </legend>
              <InviteInputField
                id={`invite-name-${idx}`}
                label={`Full name (row ${idx + 1})`}
                value={row.name}
                onChange={(v) => updateRow(idx, { name: v })}
                placeholder="Jordan Smith"
                disabled={disabled}
              />
              <InviteInputField
                id={`invite-email-${idx}`}
                label={`Email (row ${idx + 1})`}
                value={row.email}
                onChange={(v) => updateRow(idx, { email: v })}
                placeholder="jordan@example.com"
                disabled={disabled}
              />
              {validation.errors[idx]?.name ? (
                <p
                  className="text-xs text-secondary sm:col-span-2"
                  role="alert"
                  id={`invite-name-err-${idx}`}
                >
                  {validation.errors[idx]?.name}
                </p>
              ) : null}
              {validation.errors[idx]?.email ? (
                <p
                  className="text-xs text-secondary sm:col-span-2"
                  role="alert"
                  id={`invite-email-err-${idx}`}
                >
                  {validation.errors[idx]?.email}
                </p>
              ) : null}
            </fieldset>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={addRow}
            disabled={disabled}
          >
            + Add another candidate
          </Button>

          {state.status === 'error' ? (
            <div
              className="rounded border border-subtle bg-secondary p-3 text-sm text-secondary"
              role="alert"
            >
              {state.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={disabled}
            >
              Cancel
            </Button>
            <Button type="submit" loading={disabled} disabled={submitDisabled}>
              {rows.filter((r) => r.name.trim() && r.email.trim()).length > 1
                ? `Send ${rows.filter((r) => r.name.trim() && r.email.trim()).length} invites`
                : 'Send invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
