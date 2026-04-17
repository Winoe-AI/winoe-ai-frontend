import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';
const createTrialMock = jest.fn();
const pushMock = jest.fn();
const assignMock = jest.fn();
const originalLocation = window.location;
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
jest.mock('@/features/talent-partner/api', () => ({
  createTrial: (...args: unknown[]) => createTrialMock(...args),
}));
jest.mock('@/platform/auth/routing', () => {
  const actual = jest.requireActual('@/platform/auth/routing');
  return {
    ...actual,
    buildLoginUrl: jest.fn(() => '/auth/login?returnTo=%2F'),
    buildNotAuthorizedUrl: jest.fn(() => '/not-authorized'),
    buildReturnTo: jest.fn(() => '/return'),
  };
});
jest.mock('@/platform/errors/errors', () => {
  const actual = jest.requireActual('@/platform/errors/errors');
  return {
    ...actual,
    toUserMessage: jest.fn(() => 'pretty error'),
  };
});
describe('TrialCreatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, assign: assignMock },
      writable: true,
    });
  });
  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation });
  });
  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Title' },
    });
    fireEvent.change(screen.getByLabelText(/^Role$/i), {
      target: { value: 'Role' },
    });
    fireEvent.change(screen.getByLabelText(/Preferred language\/framework/i), {
      target: { value: 'Stack' },
    });
  };
  it('validates required fields', async () => {
    render(<TrialCreatePage />);
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
  });
  it('handles backend auth redirects and 403', async () => {
    render(<TrialCreatePage />);
    fillForm();
    createTrialMock.mockResolvedValue({ ok: false, status: 401 });
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    await waitFor(() => expect(createTrialMock).toHaveBeenCalled());
    createTrialMock.mockResolvedValue({ ok: false, status: 403 });
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    await waitFor(() => expect(createTrialMock).toHaveBeenCalledTimes(2));
  });
  it('shows form error when backend returns message', async () => {
    render(<TrialCreatePage />);
    fillForm();
    createTrialMock.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'boom',
    });
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });
  it('navigates to detail on success', async () => {
    render(<TrialCreatePage />);
    fillForm();
    createTrialMock.mockResolvedValue({ ok: true, id: 'trial-1' });
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/dashboard/trials/trial-1'),
    );
  });
  it('surfaces fallback when backend succeeds without id', async () => {
    render(<TrialCreatePage />);
    fillForm();
    createTrialMock.mockResolvedValue({ ok: true, id: null });
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(
      await screen.findByText(/Trial created but no id was returned/i),
    ).toBeInTheDocument();
  });
  it('uses toUserMessage on caught errors', async () => {
    render(<TrialCreatePage />);
    fillForm();
    createTrialMock.mockRejectedValue(new Error('network down'));
    fireEvent.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/pretty error/i)).toBeInTheDocument();
  });
});
