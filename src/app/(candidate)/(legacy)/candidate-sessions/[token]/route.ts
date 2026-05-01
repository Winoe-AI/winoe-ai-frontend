import { NextResponse, type NextRequest } from 'next/server';
import {
  requireCandidateToken,
  type TokenParams,
} from '../../../candidate/session/token-params';

export async function GET(
  request: NextRequest,
  { params }: { params: TokenParams },
) {
  const token = await requireCandidateToken(params);
  const redirectUrl = new URL(
    `/candidate/session/${encodeURIComponent(token)}`,
    request.url,
  );
  return NextResponse.redirect(redirectUrl, 301);
}
