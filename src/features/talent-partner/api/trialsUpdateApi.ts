import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import type { TrialAiConfig } from './typesApi';

export async function updateTrialAiConfig(
  trialId: string,
  ai: Partial<TrialAiConfig>,
): Promise<unknown> {
  const { data } = await requestTalentPartnerBff<unknown>(
    `/trials/${encodeURIComponent(trialId)}`,
    {
      method: 'PUT',
      body: { ai },
      cache: 'no-store',
    },
  );

  return data;
}
