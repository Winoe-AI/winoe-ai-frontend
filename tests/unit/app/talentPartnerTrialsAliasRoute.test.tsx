const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

describe('/talent-partner/trials alias route', () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it('redirects to /dashboard/trials', async () => {
    const { default: Page } =
      await import('@/app/(talent-partner)/talent-partner/trials/page');
    Page();
    expect(redirectMock).toHaveBeenCalledWith('/dashboard/trials');
  });
});
