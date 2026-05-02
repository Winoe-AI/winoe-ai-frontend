export type TrialPlanDay = {
  dayIndex: number;
  title: string;
  type: string | null;
  prompt: string | null;
  rubricItems: string[];
  rubricText: string | null;
  repoUrl: string | null;
  repoName: string | null;
  codespaceUrl: string | null;
  provisioned: boolean | null;
};

export type TrialPlan = {
  title: string | null;
  role: string | null;
  preferredLanguageFramework: string | null;
  focus: string | null;
  scenario: string | null;
  days: TrialPlanDay[];
};
