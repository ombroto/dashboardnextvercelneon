import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isProtectedPage = pathname.startsWith('/admin') && !isLoginPage;
  const isProtectedApi = pathname.startsWith('/api/admin');

  if ((isProtectedPage || isProtectedApi) && !req.auth) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
