import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect /site, /billing, /domain — redirect to /sign-in if no session cookie
export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionToken) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/site/:path*', '/billing/:path*', '/domain/:path*'],
};
