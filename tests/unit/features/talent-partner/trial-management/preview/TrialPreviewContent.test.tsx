/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrialPreviewContent } from '@/features/talent-partner/trial-management/preview/TrialPreviewContent';

const mockReload = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockNotify = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: mockNotify }),
}));

const approveTrialForInviting = jest.fn();
const regenerateTrialScenario = jest.fn();
const terminateTrial = jest.fn();

jest.mock('@/features/talent-partner/api/trialLifecycleApi', () => ({
  approveTrialForInviting: (...a: unknown[]) => approveTrialForInviting(...a),
  regenerateTrialScenario: (...a: unknown[]) => regenerateTrialScenario(...a),
  terminateTrial: (...a: unknown[]) => terminateTrial(...a),
}));

const useTrialPlanMock = jest.fn();

jest.mock(
  '@/features/talent-partner/trial-management/detail/hooks/useTrialPlan',
  () => ({
    useTrialPlan: (...args: unknown[]) => useTrialPlanMock(...args),
  }),
);

function readyDetail() {
  return {
    status: 'ready_for_review' as const,
    statusRaw: 'ready_for_review',
    projectBrief: '# Project Brief\n\nONLY_IN_PROJECT_BRIEF **body**.',
    storyline: 'STORYLINE_SHOULD_NOT_RENDER_AS_BRIEF',
    rubricJson: [{ dimension: 'Clarity', criteria: 'Readable', weight: '30%' }],
    rubricSummary: 'Summary',
    level: 'Senior',
    plan: {
      role: 'Backend Engineer',
      preferredLanguageFramework: 'Go',
      days: [
        { dayIndex: 1, title: 'D1', type: 'text', prompt: 'Custom day 1' },
      ],
    },
    scenarioVersion: { status: 'ready', id: 'sv1' },
    generationJob: null,
    hasJobFailure: false,
  };
}

describe('TrialPreviewContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    approveTrialForInviting.mockResolvedValue({ ok: true });
    regenerateTrialScenario.mockResolvedValue({ ok: true });
    terminateTrial.mockResolvedValue({ ok: true });
    mockReload.mockResolvedValue(undefined);
  });

  it('renders tags, Project Brief, rubric, cadence, and sticky decision panel', () => {
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    expect(
      screen.getAllByText('Backend Engineer').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Go').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('5-day Trial')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Project Brief', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ONLY_IN_PROJECT_BRIEF/)).toBeInTheDocument();
    expect(
      screen.queryByText('STORYLINE_SHOULD_NOT_RENDER_AS_BRIEF'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Evaluation Rubric' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Dimension' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Clarity')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Suggested Daily Cadence' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Day 1 — Design Doc')).toBeInTheDocument();
    expect(screen.getByText('Custom day 1')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Approve this Trial?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Approve & Invite Candidates' }),
    ).toBeInTheDocument();
  });

  it('approve calls API and redirects to Trial Detail', async () => {
    const user = userEvent.setup();
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(
      screen.getByRole('button', { name: 'Approve & Invite Candidates' }),
    );

    await waitFor(() => {
      expect(approveTrialForInviting).toHaveBeenCalledWith('trial-99');
    });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'success',
        title: 'Trial approved',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/talent-partner/trials/trial-99');
  });

  it('approve with SCENARIO_APPROVAL_PENDING uses warning notification tone', async () => {
    const user = userEvent.setup();
    approveTrialForInviting.mockResolvedValueOnce({
      ok: false,
      statusCode: 409,
      errorCode: 'SCENARIO_APPROVAL_PENDING',
      message:
        'A regenerated Project Brief is waiting for your approval. Open this Trial, select the pending scenario version, approve that brief, then return here to approve the Trial for inviting.',
      details: null,
    });
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(
      screen.getByRole('button', { name: 'Approve & Invite Candidates' }),
    );

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'warning',
          title: 'Approve the regenerated brief first',
        }),
      );
    });
  });

  it('regenerate navigates to Trial Detail after success', async () => {
    const user = userEvent.setup();
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

    await waitFor(() => {
      expect(regenerateTrialScenario).toHaveBeenCalledWith('trial-99');
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/talent-partner/trials/trial-99');
    });
    expect(mockReload).not.toHaveBeenCalled();
  });

  it('regenerate shows clean error when API rejects', async () => {
    const user = userEvent.setup();
    regenerateTrialScenario.mockResolvedValue({
      ok: false,
      message: 'Not allowed',
    });
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'error',
          title: 'Regeneration unavailable',
          description: 'Not allowed',
        }),
      );
    });
  });

  it('discard opens confirmation modal', async () => {
    const user = userEvent.setup();
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(screen.getByRole('button', { name: 'Discard draft' }));

    expect(screen.getByTestId('discard-draft-modal')).toBeInTheDocument();
    expect(
      screen.getByText(/ends the Trial as terminated/i),
    ).toBeInTheDocument();
  });

  it('Print brief as PDF calls window.print', async () => {
    const user = userEvent.setup();
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    useTrialPlanMock.mockReturnValue({
      detail: readyDetail(),
      plan: readyDetail().plan,
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: false,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    await user.click(
      screen.getByRole('button', { name: 'Print brief as PDF' }),
    );

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('shows generation state when Trial is generating', () => {
    useTrialPlanMock.mockReturnValue({
      detail: {
        ...readyDetail(),
        status: 'generating' as const,
        projectBrief: '',
        storyline: '',
        rubricSummary: '',
        plan: { ...readyDetail().plan, days: [] },
      },
      plan: { ...readyDetail().plan, days: [] },
      loading: false,
      error: null,
      statusCode: null,
      isGenerating: true,
      reload: mockReload,
    });

    render(<TrialPreviewContent trialId="trial-99" />);

    expect(screen.getByText(/Generation in progress/i)).toBeInTheDocument();
  });
});
