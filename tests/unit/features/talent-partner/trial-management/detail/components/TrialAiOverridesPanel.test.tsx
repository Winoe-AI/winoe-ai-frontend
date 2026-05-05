import { render, screen } from '@testing-library/react';
import { TrialAiOverridesPanel } from '@/features/talent-partner/trial-management/detail/components/TrialAiOverridesPanel';
import type { TrialAiConfig } from '@/features/talent-partner/api';

describe('TrialAiOverridesPanel', () => {
  it('maps raw internal agent keys to safe display labels', () => {
    const mockAiConfig: TrialAiConfig = {
      noticeVersion: 'v1',
      evalEnabledByDay: { 1: true, 2: true, 3: true, 4: true, 5: true },
      promptPackVersion: 'winoe-ai-pack-v1',
      activeScenarioSnapshot: {
        scenarioVersionId: 1,
        snapshotDigest: 'digest123',
        bundleStatus: 'ready',
        agents: [
          {
            key: 'demoPresentationReviewer',
            provider: 'anthropic',
            model: 'claude-sonnet-4-6',
            runtimeMode: 'real',
            promptVersion: 'v1',
          },
          {
            key: 'codeImplementationReviewer',
            provider: 'openai',
            model: 'gpt-5.2-codex',
            runtimeMode: 'real',
            promptVersion: 'v1',
          },
        ],
      },
      pendingScenarioSnapshot: null,
      changesPendingRegeneration: false,
      promptOverrides: [],
    };

    render(
      <TrialAiOverridesPanel
        trialId="1"
        aiConfig={mockAiConfig}
        onSaved={jest.fn()}
      />,
    );

    // Verify raw keys are NOT rendered
    expect(
      screen.queryByText('demoPresentationReviewer'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('codeImplementationReviewer'),
    ).not.toBeInTheDocument();

    // Verify safe display labels ARE rendered
    expect(screen.getByText('Handoff + Demo Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Implementation Reviewer')).toBeInTheDocument();
  });
});
