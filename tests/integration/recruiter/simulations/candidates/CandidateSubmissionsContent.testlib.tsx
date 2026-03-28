import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateSubmissionsPage from '@/features/recruiter/submission-review/CandidateSubmissionsPage';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
  type MockResponse,
} from '../../../../setup/responseHelpers';
import { __resetCandidateCache } from '@/features/recruiter/api';
import { __resetHttpClientCache } from '@/platform/api-client/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

let anchorClickSpy: jest.SpyInstance | null = null;
const originalDebugErrors = process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS;

beforeEach(() => {
  __resetCandidateCache();
  __resetHttpClientCache();
});
beforeAll(() => {
  anchorClickSpy = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
});
afterEach(() => {
  jest.resetAllMocks();
  if (originalDebugErrors === undefined)
    delete process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS;
  else process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS = originalDebugErrors;
});
afterAll(() => {
  anchorClickSpy?.mockRestore();
});

export const installFetchMock = (
  impl: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response | MockResponse>,
) => {
  const fetchMock = jest.fn(impl);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

export {
  setMockParams,
  React,
  render,
  screen,
  waitFor,
  userEvent,
  CandidateSubmissionsPage,
  getRequestUrl,
  jsonResponse,
  textResponse,
};
