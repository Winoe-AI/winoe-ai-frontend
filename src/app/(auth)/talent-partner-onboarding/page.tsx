import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthStartLink from '@/features/auth/AuthStartLink';
import { AuthPageLayout } from '@/features/auth/AuthPageLayout';
import TalentPartnerOnboardingForm from '@/features/auth/TalentPartnerOnboardingForm';
import { getCachedTalentPartnerSessionProfile } from '@/features/auth/talentPartnerOnboarding.server';
import { BRAND_NAME } from '@/platform/config/brand';
import { sanitizeReturnTo } from '@/platform/auth/routing';
import Button from '@/shared/ui/Button';

export const metadata: Metadata = {
  title: `Talent Partner setup | ${BRAND_NAME}`,
  description: `Complete talent partner onboarding for ${BRAND_NAME}.`,
};

type SearchParams = Promise<{ returnTo?: string }>;

function buildOnboardingReturnTo(returnTo: string): string {
  return `/talent-partner-onboarding?returnTo=${encodeURIComponent(returnTo)}`;
}

export default async function TalentPartnerOnboardingRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const returnTo =
    resolved && typeof resolved.returnTo === 'string'
      ? sanitizeReturnTo(resolved.returnTo)
      : '/dashboard';
  const { canTalentPartner, profile, session } =
    await getCachedTalentPartnerSessionProfile();

  if (canTalentPartner && profile?.onboardingComplete) {
    redirect(returnTo);
  }

  const onboardingReturnTo = buildOnboardingReturnTo(returnTo);
  const email =
    profile?.email ??
    (typeof session?.user?.email === 'string' ? session.user.email : '');
  const initialName =
    profile?.name ??
    (typeof session?.user?.name === 'string' ? session.user.name : '');

  if (!session?.user || !canTalentPartner) {
    return (
      <AuthPageLayout
        title="Create Talent Partner account"
        subtitle={`Sign up with Auth0, then finish your ${BRAND_NAME} workspace setup.`}
      >
        <p className="mb-4 text-sm text-gray-600">
          We need your full name and company before Talent Partner features are
          enabled.
        </p>
        <div className="space-y-3">
          <AuthStartLink
            returnTo={onboardingReturnTo}
            mode="talent_partner"
            screenHint="signup"
            className="block"
          >
            <Button
              type="button"
              className="w-full justify-center text-base font-medium"
            >
              Continue to Talent Partner signup
            </Button>
          </AuthStartLink>
          <AuthStartLink
            returnTo={onboardingReturnTo}
            mode="talent_partner"
            className="block"
          >
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center text-base font-medium"
            >
              I already have an account
            </Button>
          </AuthStartLink>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Finish Talent Partner setup"
      subtitle="Complete your profile before accessing the talent partner dashboard."
    >
      <p className="mb-4 text-sm text-gray-600">
        Your Auth0 account is ready. We still need the company details required
        to scope trials and candidate access correctly.
      </p>
      <TalentPartnerOnboardingForm
        email={email}
        initialName={initialName}
        initialCompanyName={profile?.companyName ?? null}
        returnTo={returnTo}
      />
    </AuthPageLayout>
  );
}
