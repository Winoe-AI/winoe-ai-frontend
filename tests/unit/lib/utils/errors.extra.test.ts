import { normalizeApiError, toStatus, toUserMessage } from '@/lib/errors/errors';

describe('lib/errors/errors extra coverage', () => {
  const originalDebugErrors = process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS;
  afterEach(() => {
    if (originalDebugErrors === undefined) delete process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS;
    else process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS = originalDebugErrors;
  });

  it('toStatus returns null for non-object', () => {
    expect(toStatus('string')).toBeNull();
    expect(toStatus(123)).toBeNull();
    expect(toStatus(undefined)).toBeNull();
  });

  it('normalizes code extraction and precedence', () => {
    expect(normalizeApiError({ status: 400, code: 'TOP_LEVEL_CODE' }).code).toBe('TOP_LEVEL_CODE');
    expect(normalizeApiError({ status: 400, code: '   ' }).code).toBeNull();
    expect(normalizeApiError({ status: 400, error: { code: '  ' } }).code).toBeNull();
    expect(normalizeApiError({ status: 400, detail: { code: '' } }).code).toBeNull();
    expect(normalizeApiError({ status: 400, details: { code: 'DETAILS' }, code: 'TOP' }).code).toBe('DETAILS');
  });

  it('handles message fallback logic', () => {
    expect(toUserMessage({ message: 'object message' }, 'fallback')).toBe('object message');
    expect(toUserMessage({ message: '   ' }, 'fallback')).toBe('fallback');
    expect(toUserMessage({ message: 123 }, 'fallback')).toBe('fallback');
  });

  it('uses detail message only when enabled and non-empty', () => {
    process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS = '1';
    expect(toUserMessage({ detail: 'detail text', message: '' }, 'fallback', { includeDetail: true })).toBe('detail text');
    expect(toUserMessage({ detail: '   ', message: 'msg' }, 'fallback', { includeDetail: true })).toBe('msg');
  });

  it('maps 502 and 503 to contact_support', () => {
    const result502 = normalizeApiError({ status: 502 });
    const result503 = normalizeApiError({ status: 503 });
    expect(result502.action).toBe('contact_support');
    expect(result502.status).toBe(502);
    expect(result503.action).toBe('contact_support');
    expect(result503.status).toBe(503);
  });

  it('defaults null and undefined errors to retry action', () => {
    const result1 = normalizeApiError(null);
    const result2 = normalizeApiError(undefined);
    expect(result1.status).toBeNull();
    expect(result1.action).toBe('retry');
    expect(result2.status).toBeNull();
    expect(result2.action).toBe('retry');
  });

  it('redacts token-like values in debug output', () => {
    process.env.NEXT_PUBLIC_TENON_DEBUG_ERRORS = '1';
    expect(toUserMessage({ message: 'Failed: ?refresh_token=abc123&auth_token=xyz789' }, 'fallback', { includeDetail: true })).toBe('Failed: ?refresh_token=[redacted]&auth_token=[redacted]');
    expect(toUserMessage({ message: 'Error with ?token=secret123' }, 'fallback', { includeDetail: true })).toBe('Error with ?token=[redacted]');
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(toUserMessage({ message: `Token: ${jwt}` }, 'fallback', { includeDetail: true })).toBe('Token: [redacted]');
  });
});
