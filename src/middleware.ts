import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const level    = (token?.accessLevel as number) ?? 0
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith('/dashboard') && level < 4) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    if (pathname.startsWith('/activity') && level < 4) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    if (pathname.startsWith('/users') && level < 3) {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
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