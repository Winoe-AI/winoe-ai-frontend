const dayDefinitions = [
  {
    dayIndex: 1,
    title: 'Architecture brief',
    type: 'design',
    description: 'Write your architecture plan.',
  },
  {
    dayIndex: 2,
    title: 'Build feature',
    type: 'code',
    description: 'Implement feature in repo.',
  },
  {
    dayIndex: 3,
    title: 'Debug and finalize',
    type: 'code',
    description: 'Fix bugs and finalize.',
  },
  {
    dayIndex: 4,
    title: 'Handoff demo',
    type: 'handoff',
    description: 'Record a walkthrough.',
  },
  {
    dayIndex: 5,
    title: 'Reflection',
    type: 'documentation',
    description: 'Document decisions and next steps.',
  },
];

export function buildDefaultDetail(simulationId: string) {
  return {
    id: simulationId,
    title: 'Frontend Platform Modernization',
    templateKey: 'backend_api',
    role: 'Senior Frontend Engineer',
    techStack: 'TypeScript, Next.js',
    seniority: 'senior',
    focus: 'Execution quality and communication',
    scenario: 'Build and debug a production-like frontend flow.',
    status: 'active_inviting',
    activeScenarioVersionId: 'scn-1',
    pendingScenarioVersionId: null,
    scenarioVersions: [
      {
        id: 'scn-1',
        versionIndex: 1,
        status: 'ready',
        lockedAt: null,
        contentAvailability: 'canonical',
      },
    ],
    scenarioVersionSummary: {
      id: 'scn-1',
      versionIndex: 1,
      status: 'ready',
      lockedAt: null,
    },
    storylineMd:
      'Candidates ship a day-by-day solution with coding, handoff, and documentation artifacts.',
    taskPromptsJson: dayDefinitions,
    rubricJson: { quality: 'Correctness, clarity, and pragmatic tradeoffs.' },
    ai: {
      evalEnabledByDay: {
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
      },
    },
    days: dayDefinitions,
  };
}
