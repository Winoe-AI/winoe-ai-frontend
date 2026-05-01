import { NextRequest } from 'next/server';
import { GET } from '@/app/(candidate)/(legacy)/candidate-sessions/[token]/route';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('not found');
  }),
}));

describe('legacy candidate-sessions route', () => {
  it('redirects to the canonical /candidate/session path', async () => {
    const request = new NextRequest(
      'https://example.com/candidate-sessions/tok_123?source=legacy',
    );
    const response = await GET(request, {
      params: Promise.resolve({ token: 'tok_123' }),
    });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://example.com/candidate/session/tok_123',
    );
  });

  it('encodes unsafe characters in the redirect location', async () => {
    const request = new NextRequest(
      'https://example.com/candidate-sessions/a+b?source=legacy',
    );
    const response = await GET(request, {
      params: Promise.resolve({ token: 'a+b' }),
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://example.com/candidate/session/a%2Bb',
    );
  });

  it('rejects blank tokens through notFound', async () => {
    await expect(
      GET(new NextRequest('https://example.com/candidate-sessions/blank'), {
        params: Promise.resolve({ token: ' ' }),
      }),
    ).rejects.toThrow('not found');
  });
});
