import type { Metadata } from 'next';
import FitProfilePage from '@/features/recruiter/fit-profile/FitProfilePage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Candidate fit profile | ${BRAND_NAME}`,
  description:
    'Recruiter fit profile report with evidence trail and print view.',
};

export default function Page() {
  return <FitProfilePage />;
}
