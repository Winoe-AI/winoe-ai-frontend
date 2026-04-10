import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import CompanyAiSettingsPage from '@/features/talent-partner/settings/CompanyAiSettingsPage';

export const metadata: Metadata = {
  title: `AI Settings | ${BRAND_NAME}`,
  description: 'Manage Talent Partner company AI prompt and rubric defaults.',
};

export default function TalentPartnerAiSettingsRoute() {
  return <CompanyAiSettingsPage />;
}
