import { NextRequest } from 'next/server';
import { GET } from './route';

describe('legacy candidate-session redirect', () => {
  it('redirects permanently to the canonical candidate session route', async () => {
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
});
