import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Server-side admin route protection ─────────────────────
  // Redirect unauthenticated users away from /admin/* before the page renders.
  // The access_token HttpOnly cookie is set by the backend on login.
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      const loginUrl = new URL('/auth/callback', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'auth_required');
      return NextResponse.redirect(loginUrl);
    }

    // Token exists — let the client-side role check in admin/layout.tsx handle authorization.
    // We cannot verify JWT on the Edge Runtime without the secret, but blocking
    // unauthenticated visitors server-side eliminates the biggest exposure.
  }

  // ── i18n middleware for all other routes ────────────────────
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
