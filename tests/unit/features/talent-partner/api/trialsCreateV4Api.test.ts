import { responseHelpers } from '../../../../setup';
import { __resetHttpClientCache } from '@/platform/api-client/client';

const makeJsonResponse = (payload: unknown, status = 202) =>
  responseHelpers.jsonResponse(payload, status) as unknown as Response;

describe('createTrialV4', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    __resetHttpClientCache();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset?.();
    global.fetch = realFetch;
  });

  it('POSTs to /api/v1/trials with snake_case fields and no retired fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse(
        { trial_id: '101', job_id: 'job-101', status: 'generating' },
        202,
      ),
    );

    const { createTrialV4 } =
      await import('@/features/talent-partner/api/trialsCreateV4Api');
    const result = await createTrialV4({
      roleTitle: '  Backend Engineer  ',
      seniority: 'mid',
      preferredLanguageFramework: '  Python + FastAPI  ',
      focusNotes: '  Real focus notes for the role here.  ',
      evaluationFocusAreas: ['  API design  ', 'Testing discipline'],
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(202);
    expect(result.trialId).toBe('101');
    expect(result.jobId).toBe('job-101');
    expect(result.generationStatus).toBe('generating');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/v1/trials');
    expect((init as RequestInit).method).toBe('POST');

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      role_title: 'Backend Engineer',
      seniority: 'mid',
      focus_notes: 'Real focus notes for the role here.',
      preferred_language_framework: 'Python + FastAPI',
      evaluation_focus_areas: ['API design', 'Testing discipline'],
    });

    // Make sure no retired fields leak into the payload.
    expect(body).not.toHaveProperty('template_key');
    expect(body).not.toHaveProperty('template_repository');
    expect(body).not.toHaveProperty('template_repo');
    expect(body).not.toHaveProperty('tech_stack');
    expect(body).not.toHaveProperty('techStack');
  });

  it('omits optional fields when not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse(
        { trial_id: '202', job_id: 'job-202', status: 'generating' },
        202,
      ),
    );

    const { createTrialV4 } =
      await import('@/features/talent-partner/api/trialsCreateV4Api');
    const result = await createTrialV4({
      roleTitle: 'Backend Engineer',
      seniority: 'mid',
      focusNotes: 'They will build APIs',
    });

    expect(result.ok).toBe(true);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      role_title: 'Backend Engineer',
      seniority: 'mid',
      focus_notes: 'They will build APIs',
    });
    expect(body).not.toHaveProperty('preferred_language_framework');
    expect(body).not.toHaveProperty('evaluation_focus_areas');
  });

  it('returns ok=false with a friendly message when role title or focus notes are blank', async () => {
    const { createTrialV4 } =
      await import('@/features/talent-partner/api/trialsCreateV4Api');
    const result = await createTrialV4({
      roleTitle: '   ',
      seniority: 'mid',
      focusNotes: '',
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
