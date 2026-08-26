import { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';

export function getAuthUserId(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  try {
    return verifyAuthToken(token).userId;
  } catch {
    return null;
  }
}
