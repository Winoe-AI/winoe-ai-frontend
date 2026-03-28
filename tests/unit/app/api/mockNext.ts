import { MockHeaders } from './mockNext.headers';
export { MockHeaders } from './mockNext.headers';
export { makeResponse } from './mockNext.response';

export class MockNextResponse {
  status: number;
  headers: MockHeaders;
  body: unknown;

  constructor(
    body?: unknown,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headers = new MockHeaders(init?.headers);
  }

  static json(
    body: unknown,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    return new MockNextResponse(body, {
      status: init?.status ?? 200,
      headers: init?.headers,
    });
  }

  async json() {
    return this.body;
  }
}

export class MockNextRequest {
  url: string;
  nextUrl: URL;
  method: string;
  headers: MockHeaders;
  signal: AbortSignal;
  private bodyText?: string;
  private failOnRead: boolean;

  constructor(
    url: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      bodyText?: string;
      failOnRead?: boolean;
    },
  ) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.method = init?.method ?? 'GET';
    this.headers = new MockHeaders(init?.headers);
    // Minimal AbortSignal stub used only for shape checking
    // @ts-expect-error partial signal implementation
    this.signal = { aborted: false };
    this.bodyText = init?.bodyText ?? '';
    this.failOnRead = init?.failOnRead ?? false;
  }

  async text() {
    if (this.failOnRead) {
      throw new Error('read error');
    }
    return this.bodyText ?? '';
  }

  async json() {
    const raw = await this.text();
    return JSON.parse(raw || '{}');
  }
}
