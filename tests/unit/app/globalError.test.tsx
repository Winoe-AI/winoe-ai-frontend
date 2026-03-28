import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalErrorContent } from '@/app/global-error';
const originalEnv = process.env.NODE_ENV;
const setNodeEnv = (value: string) =>
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    configurable: true,
  });

describe('GlobalError component', () => {
  let windowLocationMock: { href: string };
  const originalLocation = window.location;

  beforeAll(() => {
    windowLocationMock = { href: '' };
    Object.defineProperty(window, 'location', {
      value: windowLocationMock,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    setNodeEnv(originalEnv);
  });

  beforeEach(() => {
    windowLocationMock.href = '';
  });

  it('renders error message and retry/home buttons', () => {
    const resetMock = jest.fn();
    const error = new Error('Test error message');
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/We hit an unexpected error while loading this page/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Go home/i }),
    ).toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', () => {
    const resetMock = jest.fn();
    const error = new Error('Test error');
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('navigates to home when Go home button is clicked', () => {
    const resetMock = jest.fn();
    const error = new Error('Test error');
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    fireEvent.click(screen.getByRole('button', { name: /Go home/i }));
    expect(windowLocationMock.href).toBe('/');
  });

  it('shows error digest in production mode when available', () => {
    setNodeEnv('production');
    const resetMock = jest.fn();
    const error = Object.assign(new Error('Test error'), {
      digest: 'error-digest-123',
    });
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    expect(screen.getByText(/Error id: error-digest-123/i)).toBeInTheDocument();
    setNodeEnv(originalEnv);
  });

  it('shows error message in development mode', () => {
    setNodeEnv('development');
    const resetMock = jest.fn();
    const error = new Error('Detailed error message');
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    expect(screen.getByText('Detailed error message')).toBeInTheDocument();
    setNodeEnv(originalEnv);
  });

  it('handles error without digest in production mode', () => {
    setNodeEnv('production');
    const resetMock = jest.fn();
    const error = new Error('Test error without digest');
    render(<GlobalErrorContent error={error} reset={resetMock} />);
    expect(screen.queryByText(/Error id:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Test error without digest'),
    ).not.toBeInTheDocument();
    setNodeEnv(originalEnv);
  });
});
