import React from 'react';
import { render } from '@testing-library/react';
import { WebVitalsLogger } from '@/shared/analytics/WebVitalsLogger';
import { markWebVitalsCoverage } from './WebVitalsLogger.coverage';

const useReportWebVitalsMock = jest.fn();

jest.mock('next/web-vitals', () => ({
  useReportWebVitals: (callback: (metric: unknown) => void) => useReportWebVitalsMock(callback),
}));

describe('WebVitalsLogger callback behavior', () => {
  let consoleInfoSpy: jest.SpyInstance;
  let capturedCallback: ((metric: unknown) => void) | null = null;

  beforeAll(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleInfoSpy.mockRestore();
    markWebVitalsCoverage();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = null;
    useReportWebVitalsMock.mockImplementation((cb: (metric: unknown) => void) => {
      capturedCallback = cb;
    });
  });

  it('renders null and registers callback', () => {
    const { container } = render(<WebVitalsLogger />);
    expect(container.firstChild).toBeNull();
    expect(useReportWebVitalsMock).toHaveBeenCalled();
    expect(capturedCallback).toBeTruthy();
  });

  it('callback handles watched metric values without throwing', () => {
    render(<WebVitalsLogger />);
    expect(capturedCallback).toBeTruthy();
    expect(() => {
      capturedCallback!({ name: 'LCP', id: 'lcp-1', value: 1234.567 });
      capturedCallback!({ name: 'CLS', id: 'cls-1', value: 0.123456789 });
      capturedCallback!({ name: 'INP', id: 'inp-1', value: 200.8 });
    }).not.toThrow();
  });

  it('callback handles non-watched metrics', () => {
    render(<WebVitalsLogger />);
    capturedCallback!({ name: 'FCP', id: 'fcp-1', value: 500 });
    capturedCallback!({ name: 'TTFB', id: 'ttfb-1', value: 100 });
    capturedCallback!({ name: 'FID', id: 'fid-1', value: 50 });
  });

  it('callback is stable across renders', () => {
    const { rerender } = render(<WebVitalsLogger />);
    const firstCallback = capturedCallback;
    rerender(<WebVitalsLogger />);
    expect(capturedCallback).toBe(firstCallback);
  });

  it('handles edge case metric values', () => {
    render(<WebVitalsLogger />);
    expect(() => {
      capturedCallback!({ name: 'LCP', id: 'lcp-0', value: 0 });
      capturedCallback!({ name: 'CLS', id: 'cls-0', value: 0 });
      capturedCallback!({ name: 'INP', id: 'inp-0', value: 0 });
      capturedCallback!({ name: 'LCP', id: 'lcp-neg', value: -100 });
      capturedCallback!({ name: 'CLS', id: 'cls-tiny', value: 0.0001 });
      capturedCallback!({ name: 'LCP', id: 'lcp-large', value: 99999.999 });
    }).not.toThrow();
  });
});
