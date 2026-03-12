import type { Metadata } from 'next';
import FitProfilePage from '@/features/recruiter/simulations/candidates/fitProfile/FitProfilePage';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Candidate fit profile | ${BRAND_NAME}`,
  description:
    'Recruiter fit profile report with evidence trail and print view.',
};

export default function Page() {
  return <FitProfilePage />;
}
