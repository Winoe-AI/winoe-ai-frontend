import type { Metadata } from 'next';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulations/detail/RecruiterSimulationDetailPage';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Simulation detail | ${BRAND_NAME}`,
  description:
    'Preview scenario output, approve simulation, and invite candidates.',
};

export default function Page() {
  return <RecruiterSimulationDetailPage />;
}
