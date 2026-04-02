import { requestRecruiterBff } from './requestRecruiterBffApi';
import type { CompanyAiConfig, SimulationPromptOverrides } from './typesApi';

type CompanyAiConfigResponse = {
  companyId: number;
  companyName: string;
  promptPackVersion: string;
  promptOverrides: SimulationPromptOverrides | null;
};

export async function readCompanyAiConfig(): Promise<CompanyAiConfig> {
  const { data } = await requestRecruiterBff<CompanyAiConfigResponse>(
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
  promptOverrides: SimulationPromptOverrides | null,
): Promise<CompanyAiConfig> {
  const { data } = await requestRecruiterBff<CompanyAiConfigResponse>(
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
