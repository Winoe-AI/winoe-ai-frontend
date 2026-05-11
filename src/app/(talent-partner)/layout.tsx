import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCachedTalentPartnerSessionProfile } from '@/features/auth/talentPartnerOnboarding.server';
import TalentPartnerAppShell from '@/shared/layout/TalentPartnerAppShell';

export default async function TalentPartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { canTalentPartner, profile } =
    await getCachedTalentPartnerSessionProfile();
  if (canTalentPartner && profile && profile.onboardingComplete === false) {
    redirect('/talent-partner-onboarding?returnTo=%2Fdashboard');
  }

  const organizationName = profile?.companyName || 'Workspace';
  const userEmail = profile?.email || 'Account';
  const userDisplayName = profile?.name || undefined;

  return (
    <TalentPartnerAppShell
      organizationName={organizationName}
      userEmail={userEmail}
      userDisplayName={userDisplayName}
    >
      {children}
    </TalentPartnerAppShell>
  );
}
