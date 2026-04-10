import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import TalentPartnerDashboardPage from '@/features/talent-partner/dashboard/TalentPartnerDashboardPage';

export const metadata: Metadata = {
  title: `Dashboard | ${BRAND_NAME}`,
  description: 'Manage trials, candidates, and invites.',
};

export default async function DashboardPage() {
  return <TalentPartnerDashboardPage />;
}
