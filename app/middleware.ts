import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSecurityHeaders, generateCSPHeader, generateCSRFToken } from '@/lib/security';

// Middleware to add security headers and CSP to every response
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add standard security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add Content Security Policy header
  response.headers.set('Content-Security-Policy', generateCSPHeader());

  // For GET requests, set a CSRF token cookie (SameSite=Strict, HttpOnly false so client can read)
  if (request.method === 'GET') {
    const csrfToken = generateCSRFToken();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
};
