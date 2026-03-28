import '../../../setup/routerMock';
import { routerMock } from '../../../setup/routerMock';
import { createSimulation } from '@/features/recruiter/api';

jest.mock('@/features/recruiter/api', () => ({
  ...jest.requireActual('@/features/recruiter/api'),
  createSimulation: jest.fn(),
}));

export const assignSpy = jest.fn();
export const createSimulationMock = createSimulation as jest.MockedFunction<
  typeof createSimulation
>;
export { routerMock };

export function resetCreateSimulationMocks() {
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
