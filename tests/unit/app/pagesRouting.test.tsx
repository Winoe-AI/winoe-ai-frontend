import { render, screen } from '@testing-library/react';
import './pagesRouting.mocks';

describe('app route pages', () => {
  it('renders candidate dashboard page with normalized email', async () => {
    const mod = await import('@/app/(candidate)/candidate/dashboard/page');
    const el = await mod.default();
    render(el);
    expect(screen.getByTestId('candidate-dashboard')).toHaveAttribute(
      'data-signed-email',
      'user@example.com',
    );
  });

  it('renders candidate session page with token param', async () => {
    const { default: Page } =
      await import('@/app/(candidate)/candidate/session/[token]/page');
    const el = await Page({ params: { token: 'abc123' } });
    render(el);
    expect(screen.getByTestId('candidate-session-page')).toHaveAttribute(
      'token',
      'abc123',
    );
  });

  it('renders talent partner dashboard page', async () => {
    const { default: Page } =
      await import('@/app/(talent-partner)/dashboard/page');
    const el = await Page();
    render(el);
    expect(screen.getByTestId('talent-partner-dashboard')).toBeInTheDocument();
  });

  it('renders talent_partner trials create page', async () => {
    const { default: Page } =
      await import('@/app/(talent-partner)/dashboard/trials/new/page');
    const el = await Page();
    render(el);
    expect(screen.getByTestId('trial-create')).toBeInTheDocument();
  });
});
