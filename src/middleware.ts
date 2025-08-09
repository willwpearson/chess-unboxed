import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Redirect classic and programming chess routes to unboxed equivalents
  if (url.pathname.startsWith('/play/classic')) {
    url.pathname = url.pathname.replace('/play/classic', '/play/unboxed');
    return NextResponse.redirect(url);
  }
  
  if (url.pathname.startsWith('/play/programming')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // Redirect variant-specific lobby/leaderboard routes
  if (url.pathname.startsWith('/lobby/classic') || url.pathname.startsWith('/lobby/programming')) {
    url.pathname = '/lobby';
    return NextResponse.redirect(url);
  }
  
  if (url.pathname.startsWith('/leaderboard/classic') || url.pathname.startsWith('/leaderboard/programming')) {
    url.pathname = '/leaderboard';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/play/classic/:path*',
    '/play/programming/:path*',
    '/lobby/classic/:path*',
    '/lobby/programming/:path*',
    '/leaderboard/classic/:path*',
    '/leaderboard/programming/:path*'
  ]
};