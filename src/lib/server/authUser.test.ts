import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { signAuthToken } from '@/lib/jwt';
import { getAuthUserId } from './authUser';

function requestWith({ cookie, bearer }: { cookie?: string; bearer?: string }): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set('cookie', `auth-token=${cookie}`);
  if (bearer) headers.set('authorization', `Bearer ${bearer}`);
  return new NextRequest('http://localhost/api/anything', { headers });
}

describe('getAuthUserId', () => {
  it('returns null when no token is present', () => {
    expect(getAuthUserId(requestWith({}))).toBeNull();
  });

  it('returns null for an invalid token', () => {
    expect(getAuthUserId(requestWith({ cookie: 'garbage' }))).toBeNull();
  });

  it('extracts the user id from a valid cookie token', () => {
    const token = signAuthToken({ userId: 'user-1', username: 'alice' });
    expect(getAuthUserId(requestWith({ cookie: token }))).toBe('user-1');
  });

  it('extracts the user id from a valid bearer token when no cookie is set', () => {
    const token = signAuthToken({ userId: 'user-2', username: 'bob' });
    expect(getAuthUserId(requestWith({ bearer: token }))).toBe('user-2');
  });

  it('prefers the cookie token over the bearer token when both are present', () => {
    const cookieToken = signAuthToken({ userId: 'cookie-user', username: 'alice' });
    const bearerToken = signAuthToken({ userId: 'bearer-user', username: 'bob' });
    expect(getAuthUserId(requestWith({ cookie: cookieToken, bearer: bearerToken }))).toBe('cookie-user');
  });
});
