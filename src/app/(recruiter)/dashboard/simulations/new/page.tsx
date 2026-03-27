import type { Metadata } from 'next';
import SimulationCreatePage from '@/features/recruiter/simulation-management/create/SimulationCreatePage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Create simulation | ${BRAND_NAME}`,
  description: 'Set up a new 5-day simulation for candidates.',
};

export default function Page() {
  return <SimulationCreatePage />;
}
