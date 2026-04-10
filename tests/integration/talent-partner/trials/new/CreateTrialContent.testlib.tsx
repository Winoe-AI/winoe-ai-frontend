import '../../../setup/routerMock';
import { routerMock } from '../../../setup/routerMock';
import { createTrial } from '@/features/talent-partner/api';

jest.mock('@/features/talent-partner/api', () => ({
  ...jest.requireActual('@/features/talent-partner/api'),
  createTrial: jest.fn(),
}));

export const assignSpy = jest.fn();
export const createTrialMock = createTrial as jest.MockedFunction<
  typeof createTrial
>;
export { routerMock };

export function resetCreateTrialMocks() {
  jest.resetAllMocks();
  assignSpy.mockReset();
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, assign: assignSpy },
  });
}

export function expectDashboardBackNavigation() {
  expect(routerMock.push).toHaveBeenCalledWith('/dashboard');
}
