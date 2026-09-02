import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  if (req.nextUrl.pathname.startsWith('/admin') && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
