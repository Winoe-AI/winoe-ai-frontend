'use client';

import { FormEvent, startTransition, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import { buildLoginHref } from '@/features/auth/authPaths';

type TalentPartnerOnboardingFormProps = {
  email: string;
  initialCompanyName?: string | null;
  initialName?: string | null;
  returnTo: string;
};

function normalizeMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Unable to complete onboarding right now.';
  }
  const record = payload as Record<string, unknown>;
  const detail = record.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  const message = record.message;
  if (typeof message === 'string' && message.trim()) return message;
  return 'Unable to complete onboarding right now.';
}

export default function TalentPartnerOnboardingForm({
  email,
  initialCompanyName,
  initialName,
  returnTo,
}: TalentPartnerOnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? '');
  const [companyName, setCompanyName] = useState(initialCompanyName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loginHref = useMemo(
    () =>
      buildLoginHref(
        `/talent-partner-onboarding?returnTo=${encodeURIComponent(returnTo)}`,
        'talent_partner',
      ),
    [returnTo],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/talent-partner-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, companyName }),
      });

      if (response.ok) {
        startTransition(() => {
          router.replace(returnTo);
          router.refresh();
        });
        return;
      }

      if (response.status === 401) {
        window.location.assign(loginHref);
        return;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      setError(normalizeMessage(payload));
    } catch {
      setError('Unable to complete onboarding right now.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label
          htmlFor="talent-partner-email"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Work email
        </label>
        <Input id="talent-partner-email" value={email} disabled readOnly />
      </div>

      <div>
        <label
          htmlFor="talent-partner-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Full name
        </label>
        <Input
          id="talent-partner-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jane Talent Partner"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label
          htmlFor="company-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Company name
        </label>
        <Input
          id="company-name"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Acme, Inc."
          maxLength={255}
          required
        />
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isSaving}>
          Finish setup
        </Button>
        <a
          href="/auth/logout"
          className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
        >
          Sign out
        </a>
      </div>
    </form>
  );
}
