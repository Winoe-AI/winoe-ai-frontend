import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import type { CompanyAiConfig, TrialPromptOverrides } from './typesApi';

type CompanyAiConfigResponse = {
  companyId: number;
  companyName: string;
  promptPackVersion: string;
  promptOverrides: TrialPromptOverrides | null;
};

export async function readCompanyAiConfig(): Promise<CompanyAiConfig> {
  const { data } = await requestTalentPartnerBff<CompanyAiConfigResponse>(
    '/companies/me/ai-config',
    { cache: 'no-store' },
  );

  return {
    companyId: Number(data.companyId),
    companyName: data.companyName,
    promptPackVersion: data.promptPackVersion,
    promptOverrides: data.promptOverrides ?? null,
  };
}

export async function updateCompanyAiConfig(
  promptOverrides: TrialPromptOverrides | null,
): Promise<CompanyAiConfig> {
  const { data } = await requestTalentPartnerBff<CompanyAiConfigResponse>(
    '/companies/me/ai-config',
    {
      method: 'PUT',
      body: { promptOverrides },
      cache: 'no-store',
    },
  );

  return {
    companyId: Number(data.companyId),
    companyName: data.companyName,
    promptPackVersion: data.promptPackVersion,
    promptOverrides: data.promptOverrides ?? null,
  };
}
