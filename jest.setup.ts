import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { Blob, File } from 'node:buffer';
import { createRequire } from 'node:module';
import { ReadableStream, TransformStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

class TestMessagePort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;
  #peer: TestMessagePort | null = null;
  #listeners = new Set<EventListenerOrEventListenerObject>();

  _connect(peer: TestMessagePort) {
    this.#peer = peer;
  }

  postMessage(data: unknown) {
    const peer = this.#peer;
    if (!peer) return;
    queueMicrotask(() => {
      const event = { data } as MessageEvent<unknown>;
      peer.onmessage?.(event);
      for (const listener of peer.#listeners) {
        if (typeof listener === 'function') {
          listener(event);
          continue;
        }
        listener.handleEvent(event);
      }
    });
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type !== 'message') return;
    this.#listeners.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    if (type !== 'message') return;
    this.#listeners.delete(listener);
  }

  dispatchEvent(event: Event) {
    void event;
    return true;
  }

  start() {}

  close() {
    this.#listeners.clear();
    this.onmessage = null;
    this.onmessageerror = null;
    this.#peer = null;
  }
}

class TestMessageChannel {
  port1: TestMessagePort;
  port2: TestMessagePort;

  constructor() {
    this.port1 = new TestMessagePort();
    this.port2 = new TestMessagePort();
    this.port1._connect(this.port2);
    this.port2._connect(this.port1);
  }
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
if (!globalThis.Blob) {
  globalThis.Blob = Blob as typeof globalThis.Blob;
}
if (!globalThis.File) {
  globalThis.File = File as typeof globalThis.File;
}
if (!globalThis.ReadableStream) {
  globalThis.ReadableStream =
    ReadableStream as typeof globalThis.ReadableStream;
}
if (!globalThis.TransformStream) {
  globalThis.TransformStream =
    TransformStream as typeof globalThis.TransformStream;
}
if (!globalThis.MessagePort) {
  globalThis.MessagePort =
    TestMessagePort as unknown as typeof globalThis.MessagePort;
}
if (!globalThis.MessageChannel) {
  globalThis.MessageChannel =
    TestMessageChannel as unknown as typeof globalThis.MessageChannel;
}

const runtimeRequire = createRequire(import.meta.url);
const { fetch, Headers, Request, Response } = runtimeRequire(
  'undici',
) as typeof import('undici');

if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
}
if (!globalThis.Headers) {
  globalThis.Headers = Headers as typeof globalThis.Headers;
}
if (!globalThis.Request) {
  globalThis.Request = Request as typeof globalThis.Request;
}
if (!globalThis.Response) {
  globalThis.Response = Response as typeof globalThis.Response;
}

runtimeRequire('./tests/setup/jest/testingLibraryQueryClientMock');
runtimeRequire('./tests/setup/jest/consoleSilence');
runtimeRequire('./tests/setup/jest/reactMarkdownMock');
runtimeRequire('./tests/setup/jest/candidateApiCompatMocks');

afterEach(() => {
  cleanup();
});

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
