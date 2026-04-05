import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import CompanyAiSettingsPage from '@/features/recruiter/settings/CompanyAiSettingsPage';

export const metadata: Metadata = {
  title: `AI Settings | ${BRAND_NAME}`,
  description: 'Manage recruiter company AI prompt and rubric defaults.',
};

export default function RecruiterAiSettingsRoute() {
  return <CompanyAiSettingsPage />;
}
