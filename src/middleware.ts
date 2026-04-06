import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const level    = (token?.accessLevel as number) ?? 0
    const pathname = req.nextUrl.pathname

    // /dashboard — Super Admin (4) only
    if (pathname.startsWith('/dashboard') && level < 4) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    if (pathname.startsWith('/activity') && level < 4) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }


    // /users — Admin (3) and above only
    if (pathname.startsWith('/users') && level < 3) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    // All other protected routes — any authenticated user (level >= 1)
    return NextResponse.next()
  },
  {
    callbacks: {
      // false → redirect to /login
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contracts/:path*',
    '/packages/:path*',
    '/details/:path*',
    '/activity/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/running-balance/:path*',
    '/amendment-log/:path*',
    '/signatories/:path*',
  ],
}