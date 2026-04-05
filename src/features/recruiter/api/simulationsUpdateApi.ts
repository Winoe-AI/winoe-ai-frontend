import { requestRecruiterBff } from './requestRecruiterBffApi';
import type { SimulationAiConfig } from './typesApi';

export async function updateSimulationAiConfig(
  simulationId: string,
  ai: Partial<SimulationAiConfig>,
): Promise<unknown> {
  const { data } = await requestRecruiterBff<unknown>(
    `/simulations/${encodeURIComponent(simulationId)}`,
    {
      method: 'PUT',
      body: { ai },
      cache: 'no-store',
    },
  );

  return data;
}
