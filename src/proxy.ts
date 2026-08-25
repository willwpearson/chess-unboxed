import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Redirect any removed routes to dashboard
  if (
    url.pathname.startsWith('/play/classic') ||
    url.pathname.startsWith('/play/programming') ||
    url.pathname.startsWith('/play/unboxed/endless') ||
    url.pathname.startsWith('/play/unboxed/multiplayer') ||
    url.pathname === '/lobby' ||
    url.pathname === '/leaderboard' ||
    url.pathname === '/stats'
  ) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/play/classic/:path*',
    '/play/programming/:path*',
    '/play/unboxed/endless',
    '/play/unboxed/multiplayer',
    '/lobby',
    '/leaderboard',
    '/stats',
  ]
};
