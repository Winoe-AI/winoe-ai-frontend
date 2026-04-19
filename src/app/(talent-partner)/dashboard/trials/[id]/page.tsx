import type { Metadata } from 'next';
import TalentPartnerTrialDetailPage from '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Trial detail | ${BRAND_NAME}`,
  description:
    'Preview the project brief, review tasks and rubric, approve and activate the trial, manage candidate invites, and terminate the lifecycle when needed.',
};

export default function Page() {
  return <TalentPartnerTrialDetailPage />;
}
