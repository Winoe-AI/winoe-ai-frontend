import type { Metadata } from 'next';
import TalentPartnerTrialDetailPage from '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Trial detail | ${BRAND_NAME}`,
  description: 'Preview scenario output, approve trial, and invite candidates.',
};

export default function Page() {
  return <TalentPartnerTrialDetailPage />;
}
