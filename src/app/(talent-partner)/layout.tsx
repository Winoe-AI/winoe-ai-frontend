import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCachedTalentPartnerSessionProfile } from '@/features/auth/talentPartnerOnboarding.server';
import AppShell from '@/shared/layout/AppShell';

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
  return <AppShell navScope="talent_partner">{children}</AppShell>;
}
