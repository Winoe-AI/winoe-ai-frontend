import type { Metadata } from 'next';
import { TrialPreviewContent } from '@/features/talent-partner/trial-management/preview/TrialPreviewContent';
import { BRAND_NAME } from '@/platform/config/brand';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: `Trial preview | ${BRAND_NAME}`,
  description:
    'Review the generated Project Brief and Evaluation Rubric before inviting candidates.',
};

export default async function TrialPreviewPage({ params }: Props) {
  const { id } = await params;
  return <TrialPreviewContent trialId={id} />;
}
