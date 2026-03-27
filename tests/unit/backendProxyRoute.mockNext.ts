import { TextDecoder, TextEncoder } from 'util';

const buildHeaders = (
  init?:
    | Record<string, string>
    | { forEach?: (cb: (value: string, key: string) => void) => void },
) => {
  const store = new Map<string, string>();
  if (init && typeof (init as { forEach?: unknown }).forEach === 'function') {
    (init as { forEach: (cb: (value: string, key: string) => void) => void })
      .forEach((value, key) => store.set(key.toLowerCase(), value));
  } else {
    Object.entries((init as Record<string, string>) ?? {}).forEach(([k, v]) =>
      store.set(k.toLowerCase(), v),
    );
  }
  return {
    get: (key: string) => store.get(key.toLowerCase()) ?? null,
    set: (key: string, value: string) => store.set(key.toLowerCase(), value),
    delete: (key: string) => store.delete(key.toLowerCase()),
    forEach: (cb: (value: string, key: string) => void) =>
      store.forEach((value, key) => cb(value, key)),
  };
};

export class MockNextResponse {
  status: number;
  body: unknown;
  headers: ReturnType<typeof buildHeaders>;
  constructor(body?: unknown, init?: { status?: number; headers?: unknown }) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headers = buildHeaders(init?.headers as Record<string, string>);
  }
  static json(body: unknown, init?: { status?: number; headers?: unknown }) {
    return new MockNextResponse(body, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
    });
  }
}

export class MockNextRequest {
  url: string;
  nextUrl: URL;
  headers: ReturnType<typeof buildHeaders>;
  method: string;
  private _body?: ArrayBuffer;
  private _textBody?: string;
  signal: AbortSignal;

  constructor(
    url: URL | string,
    init?: { method?: string; headers?: Record<string, string>; body?: string | ArrayBuffer },
  ) {
    this.url = url.toString();
    this.nextUrl = new URL(this.url);
    this.method = init?.method ?? 'GET';
    this.signal = new AbortController().signal;
    this.headers = buildHeaders(init?.headers as Record<string, string>);
    if (typeof init?.body === 'string') {
      this._textBody = init.body;
      this._body = new TextEncoder().encode(init.body).buffer;
    } else if (init?.body) {
      this._body = init.body as ArrayBuffer;
    }
  }

  async arrayBuffer() {
    return this._body ?? new ArrayBuffer(0);
  }

  async text() {
    if (typeof this._textBody === 'string') return this._textBody;
    return this._body ? new TextDecoder().decode(this._body) : '';
  }
}
