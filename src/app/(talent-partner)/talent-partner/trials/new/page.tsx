import type { Metadata } from 'next';
import NewTrialWizard from '@/features/talent-partner/trial-management/create/NewTrialWizard';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `New Trial | ${BRAND_NAME}`,
  description:
    'Create a from-scratch Trial: Winoe drafts the Project Brief and rubric from your role context.',
};

export default function Page() {
  return <NewTrialWizard />;
}
