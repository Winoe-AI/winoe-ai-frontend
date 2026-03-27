import { jest } from '@jest/globals';
import { responseHelpers } from '../../../../../setup';

export const jsonRes = (
  body: unknown,
  status?: number,
  headers?: Record<string, string>,
) => responseHelpers.jsonResponse(body, status, headers) as unknown as Response;

export type FetchMock = jest.MockedFunction<typeof fetch>;

const originalApiBase = process.env.NEXT_PUBLIC_TENON_API_BASE_URL;
const OriginalXmlHttpRequest = global.XMLHttpRequest;

export async function importHandoffApi() {
  jest.resetModules();
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = 'http://api.example.com';
  return import('@/features/candidate/tasks/handoff/handoffApi');
}

export function restoreHandoffApiEnv() {
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = originalApiBase;
  global.XMLHttpRequest = OriginalXmlHttpRequest;
}

export class MockXmlHttpRequest {
  static latest: MockXmlHttpRequest | null = null;
  readonly upload: {
    onprogress:
      | ((event: {
          lengthComputable: boolean;
          loaded: number;
          total: number;
        }) => void)
      | null;
  } = { onprogress: null };
  status = 0;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onload: (() => void) | null = null;
  method: string | null = null;
  url: string | null = null;
  headers: Record<string, string> = {};
  body: unknown;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
    MockXmlHttpRequest.latest = this;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
}
