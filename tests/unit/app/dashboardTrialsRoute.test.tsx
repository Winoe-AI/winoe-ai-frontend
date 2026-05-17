const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

describe('/dashboard/trials route', () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it('redirects to /talent-partner/trials', async () => {
    const { default: Page } =
      await import('@/app/(talent-partner)/dashboard/trials/page');
    Page();
    expect(redirectMock).toHaveBeenCalledWith('/talent-partner/trials');
  });
});
