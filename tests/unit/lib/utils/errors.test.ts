import {
  coerceError,
  errorDetailEnabled,
  isNotFound,
  normalizeApiError,
  toStatus,
  toUserMessage,
} from '@/platform/errors/errors';

describe('lib/errors/errors', () => {
  const originalDebugErrors = process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS;
  afterEach(() => {
    if (originalDebugErrors === undefined)
      delete process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS;
    else process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS = originalDebugErrors;
  });

  it('extracts status and detects not found', () => {
    expect(toStatus({ status: 404 })).toBe(404);
    expect(toStatus({ status: '404' })).toBeNull();
    expect(toStatus(null)).toBeNull();
    expect(isNotFound({ status: 404 })).toBe(true);
    expect(isNotFound({ status: 500 })).toBe(false);
  });

  it('formats user messages with fallback and detail handling', () => {
    expect(toUserMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(toUserMessage({ message: '  spaced  ' }, 'fallback')).toBe('spaced');
    expect(toUserMessage({}, 'fallback')).toBe('fallback');
    process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS = 'TRUE';
    expect(errorDetailEnabled()).toBe(true);
    expect(
      toUserMessage({ detail: 'detail msg', message: 'msg' }, 'fallback', {
        includeDetail: true,
      }),
    ).toBe('detail msg');
    expect(
      toUserMessage({ detail: 'secret', message: 'shown' }, 'fallback', {
        includeDetail: false,
      }),
    ).toBe('shown');
  });

  it('redacts secrets in debug message paths', () => {
    process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS = 'TRUE';
    const bearer = new Error(
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
    );
    expect(toUserMessage(bearer, 'fallback')).toBe('Bearer [redacted]');
    expect(
      toUserMessage(
        { message: 'Request failed: ?access_token=abc123&id_token=def456' },
        'fallback',
      ),
    ).toBe('Request failed: ?access_token=[redacted]&id_token=[redacted]');
  });

  it('coerces different error shapes to Error', () => {
    const errObj = coerceError({ message: 'custom' });
    expect(errObj).toBeInstanceOf(Error);
    expect(errObj.message).toBe('Unknown error');
    expect(coerceError('text').message).toBe('text');
    const original = new Error('original');
    expect(coerceError(original)).toBe(original);
  });

  it('normalizes action/message by status', () => {
    const signin401 = normalizeApiError({ status: 401 });
    const signin403 = normalizeApiError({ status: 403 });
    const refresh404 = normalizeApiError({ status: 404 });
    const retry429 = normalizeApiError({ status: 429 });
    const retry408 = normalizeApiError({ status: 408 });
    const retry504 = normalizeApiError({ status: 504 });
    const retry0 = normalizeApiError({ status: 0 });
    const support500 = normalizeApiError({ status: 500 });
    const default400 = normalizeApiError({ status: 400, message: 'Bad input' });

    expect(signin401.action).toBe('signin');
    expect(signin401.message).toContain('sign in');
    expect(signin403.action).toBe('signin');
    expect(refresh404.action).toBe('refresh');
    expect(refresh404.message).toContain('Not found');
    expect(retry429.action).toBe('retry');
    expect(retry429.message).toContain('Too many attempts');
    expect(retry408.action).toBe('retry');
    expect(retry504.action).toBe('retry');
    expect(retry0.action).toBe('retry');
    expect(support500.action).toBe('contact_support');
    expect(support500.message).toContain('Server issue');
    expect(default400.action).toBe('retry');
    expect(default400.message).toBe('Bad input');
  });

  it('extracts nested error codes and toggles errorDetailEnabled env', () => {
    expect(
      normalizeApiError({ status: 400, error: { code: 'VALIDATION_ERROR' } })
        .code,
    ).toBe('VALIDATION_ERROR');
    expect(
      normalizeApiError({ status: 400, detail: { code: 'DETAIL_CODE' } }).code,
    ).toBe('DETAIL_CODE');
    expect(
      normalizeApiError({ status: 400, details: { code: 'DETAILS_CODE' } })
        .code,
    ).toBe('DETAILS_CODE');

    delete process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS;
    expect(errorDetailEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_WINOE_DEBUG_ERRORS = '1';
    expect(errorDetailEnabled()).toBe(true);
  });
});
