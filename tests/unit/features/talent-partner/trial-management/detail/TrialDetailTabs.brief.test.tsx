/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrialDetailTabs } from '@/features/talent-partner/trial-management/detail/components/TrialDetailTabs';
import type { TrialDetailViewProps } from '@/features/talent-partner/trial-management/detail/components/types';

const scenarioVersion = {
  id: 'sv-1',
  versionIndex: 1,
  status: 'locked',
  uiStatus: 'locked' as const,
  lockedAt: '2020-01-01',
  isLocked: true,
  isActive: true,
  isPending: false,
  contentAvailability: 'canonical' as const,
  storylineMd: 'STORYLINE_NOT_BRIEF',
  projectBriefMd: '# Project Brief\n\nONLY_FROM_PROJECT_BRIEF_MD',
  taskPrompts: [] as Array<Record<string, unknown>>,
  rubric: {} as Record<string, unknown>,
};

const search = {
  search: '',
  setSearch: jest.fn(),
  pagedCandidates: [] as const,
  visibleCandidates: [] as const,
  page: 1,
  pageCount: 1,
  setPage: jest.fn(),
};

const minimalProps: TrialDetailViewProps = {
  trialId: 't1',
  trialStatus: 'active_inviting',
  selectedScenarioStatusForDisplay: 'locked',
  scenarioVersionLabel: 'v1',
  scenarioIdLabel: 'sv-1',
  scenarioLocked: true,
  scenarioLockedAt: '2020-01-01',
  scenarioVersions: [scenarioVersion],
  selectedScenarioVersionId: 'sv-1',
  onSelectScenarioVersion: jest.fn(),
  selectedScenarioVersion: scenarioVersion,
  previousScenarioVersion: null,
  scenarioLockBannerMessage: null,
  scenarioContentUnavailableMessage: null,
  scenarioGeneratingLabel: null,
  scenarioEditorDisabled: true,
  scenarioEditorDisabledReason: null,
  scenarioEditorSaving: false,
  scenarioEditorSaveError: null,
  scenarioEditorFieldErrors: {},
  scenarioEditorDraft: null,
  onScenarioEditorDraftChange: jest.fn(),
  onSaveScenarioEdits: jest.fn(),
  inviteEnabled: true,
  inviteDisabledReason: null,
  inviteResendEnabled: true,
  inviteResendDisabledReason: null,
  actionError: null,
  canApprove: false,
  approveButtonLabel: 'Approve',
  approveLoading: false,
  onApprove: jest.fn(),
  regenerateLoading: false,
  regenerateDisabled: true,
  onRegenerate: jest.fn(),
  terminatePending: false,
  terminateModalOpen: false,
  setTerminateModalOpen: jest.fn(),
  onTerminate: jest.fn(async () => {}),
  cleanupJobIds: [],
  retryGenerateLoading: false,
  onRetryGenerate: jest.fn(),
  titleLabel: 'T',
  roleLabel: 'R',
  preferredLanguageFrameworkLabel: 'Py',
  levelLabel: 'Mid',
  focusLabel: 'F',
  companyContextLabel: 'C',
  notesLabel: null,
  aiConfig: null,
  scenarioLabel: 'WRONG_SCENARIO_LABEL',
  rubricSummary: null,
  scenarioContentUnavailableMessageForPlan: null,
  planDays: [],
  planLoading: false,
  planStatusCode: null,
  generating: false,
  jobFailureMessage: null,
  jobFailureCode: null,
  planError: null,
  reloadPlan: jest.fn(),
  canActivate: false,
  activateButtonLabel: 'Activate',
  activateLoading: false,
  onActivate: jest.fn(async () => {}),
  candidates: [],
  candidatesLoading: false,
  candidatesError: null,
  reloadCandidates: jest.fn(),
  search,
  rowStates: {},
  onCopy: jest.fn(),
  onResend: jest.fn(),
  onCloseManual: jest.fn(),
  cooldownNow: 0,
  inviteModalOpen: false,
  setInviteModalOpen: jest.fn(),
  inviteFlowState: { status: 'idle' },
  submitInvite: jest.fn(async () => {}),
  resetInviteFlow: jest.fn(),
};

describe('TrialDetailTabs Brief', () => {
  it('renders Project Brief from projectBriefMd, not scenario label', async () => {
    const user = userEvent.setup();
    render(<TrialDetailTabs props={minimalProps} onInvite={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Brief' }));

    const heading = screen.getByRole('heading', {
      name: 'Project Brief',
      level: 3,
    });
    const region = heading.parentElement;
    expect(region).toBeTruthy();
    expect(
      within(region!).getByText(/ONLY_FROM_PROJECT_BRIEF_MD/),
    ).toBeInTheDocument();
    expect(
      within(region!).queryByText('WRONG_SCENARIO_LABEL'),
    ).not.toBeInTheDocument();
  });
});

describe('TrialDetailTabs Activity', () => {
  it('summarizes locked scenario and invited candidates', async () => {
    const user = userEvent.setup();
    const props: TrialDetailViewProps = {
      ...minimalProps,
      candidates: [
        {
          candidateSessionId: 1,
          inviteEmail: 'a@example.com',
          candidateName: 'A',
          status: 'not_started',
          startedAt: null,
          completedAt: null,
          hasReport: false,
          inviteUrl: 'https://example.com/invite/1',
          inviteEmailSentAt: '2026-05-01T12:00:00.000Z',
        },
      ],
    };
    render(<TrialDetailTabs props={props} onInvite={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Activity' }));
    expect(
      await screen.findByText(/Scenario v1 is locked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 candidate invite link\(s\) are available/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when there is no scenario milestone or invites', async () => {
    const user = userEvent.setup();
    const props: TrialDetailViewProps = {
      ...minimalProps,
      selectedScenarioVersion: {
        ...scenarioVersion,
        uiStatus: 'generating',
        isLocked: false,
      },
      candidates: [],
    };
    render(<TrialDetailTabs props={props} onInvite={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Activity' }));
    expect(
      await screen.findByText(/No Trial activity recorded yet/i),
    ).toBeInTheDocument();
  });
});
