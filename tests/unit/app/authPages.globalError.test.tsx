import { render, screen } from '@testing-library/react';
import { resetAuthPageMocks } from './authPages.testlib';

describe('global error route', () => {
  beforeEach(() => {
    resetAuthPageMocks();
  });

  it('shows digest in production and message in development', async () => {
    const { GlobalErrorContent } = await import('@/app/global-error');
    const reset = jest.fn();

    render(
      GlobalErrorContent({
        error: Object.assign(new Error('fail'), { digest: '123' }),
        reset,
      }),
    );
    expect(screen.getByText(/Error id: 123/)).toBeInTheDocument();

    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    render(
      GlobalErrorContent({
        error: Object.assign(new Error('boom'), { digest: undefined }),
        reset,
      }),
    );
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    process.env.NODE_ENV = prevEnv;
  });

  it('go-home button updates location href', async () => {
    const { GlobalErrorContent } = await import('@/app/global-error');
    const originalLocation = window.location;
    const reset = jest.fn();

    // @ts-expect-error redefining for test
    delete (window as { location?: Location }).location;
    const stubLocation: { href: string } = { href: 'http://initial.test' };
    // @ts-expect-error redefine location for test
    window.location = stubLocation as unknown as Location;

    render(
      GlobalErrorContent({
        error: Object.assign(new Error('boom'), { digest: undefined }),
        reset,
      }),
    );
    screen.getByRole('button', { name: /Go home/i }).click();
    expect(stubLocation.href).toBe('/');

    window.location = originalLocation;
  });
});
