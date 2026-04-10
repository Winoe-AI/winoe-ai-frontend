import { HttpError } from '@/platform/api-client/errors/errors';
import { parseTalentPartnerResponse } from '@/features/talent-partner/api/talent-partnerResponseApi';

describe('parseTalentPartnerResponse', () => {
  it('throws HttpError for null/undefined responses', () => {
    expect(() => parseTalentPartnerResponse(null)).toThrow(HttpError);
    expect(() => parseTalentPartnerResponse(undefined)).toThrow(
      'Request failed',
    );
  });

  it('throws HttpError with status/message/details when response is ok=false', () => {
    try {
      parseTalentPartnerResponse({
        ok: false,
        status: 422,
        message: 'Invalid payload',
        details: { field: 'email' },
      });
      throw new Error('expected parseTalentPartnerResponse to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(422);
      expect((error as HttpError).message).toBe('Invalid payload');
      expect((error as { details?: unknown }).details).toEqual({
        field: 'email',
      });
    }
  });

  it('falls back to nested error.status and default message/status values', () => {
    try {
      parseTalentPartnerResponse({
        ok: false,
        error: { status: 403, message: 'Forbidden' },
      });
      throw new Error('expected parseTalentPartnerResponse to throw');
    } catch (error) {
      expect((error as HttpError).status).toBe(403);
      expect((error as HttpError).message).toBe('Request failed');
      expect((error as { details?: unknown }).details).toEqual({
        status: 403,
        message: 'Forbidden',
      });
    }
  });

  it('returns response data and requestId when data envelope is used', () => {
    const headers = new Headers({ 'x-winoe-request-id': 'rid-header' });

    const parsed = parseTalentPartnerResponse<{ value: number }>({
      data: { value: 7 },
      requestId: 'rid-explicit',
      headers,
    });

    expect(parsed).toEqual({
      data: { value: 7 },
      requestId: 'rid-explicit',
    });
  });

  it('returns raw payload and requestId from headers when no data envelope exists', () => {
    const headers = new Headers({ 'x-winoe-request-id': 'rid-header' });

    const parsed = parseTalentPartnerResponse<{ value: string }>({
      value: 'ok',
      headers,
    });

    expect(parsed).toEqual({
      data: { value: 'ok', headers },
      requestId: 'rid-header',
    });
  });
});
