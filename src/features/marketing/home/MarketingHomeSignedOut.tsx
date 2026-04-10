import AuthStartLink from '@/features/auth/AuthStartLink';
import { BRAND_NAME } from '@/platform/config/brand';
import { ActionRow } from '../shared/ActionRow';
import { primaryCtaClass, secondaryCtaClass } from '../shared/ctaClasses';

export function MarketingHomeSignedOut() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome to {BRAND_NAME}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Run multi-day work trials that replace traditional interviews for
          backend engineers.
        </p>
      </div>

      <ActionRow align="center">
        <AuthStartLink
          returnTo="/dashboard"
          mode="talent_partner"
          className={primaryCtaClass}
        >
          Talent Partner login
        </AuthStartLink>

        <AuthStartLink
          returnTo="/candidate/dashboard"
          mode="candidate"
          className={secondaryCtaClass}
        >
          Candidate portal
        </AuthStartLink>
      </ActionRow>

      <p className="mt-4 text-xs text-slate-500">
        In production, candidates will receive a unique trial link like{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.7rem]">
          /candidate/session/&lt;invite-token&gt;
        </code>
        .
      </p>
    </div>
  );
}
