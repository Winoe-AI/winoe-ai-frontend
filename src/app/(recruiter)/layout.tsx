import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCachedRecruiterSessionProfile } from '@/features/auth/recruiterOnboarding.server';
import AppShell from '@/shared/layout/AppShell';

export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { canRecruiter, profile } = await getCachedRecruiterSessionProfile();
  if (canRecruiter && profile && profile.onboardingComplete === false) {
    redirect('/recruiter-onboarding?returnTo=%2Fdashboard');
  }
  return <AppShell navScope="recruiter">{children}</AppShell>;
}
