// client/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Verifikasi apakah sesi login/role tersedia pada cookie
  const userRole = request.cookies.get('user_role')?.value?.toLowerCase();

  // Redirect ke halaman login jika belum autentikasi
  if (!userRole && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Verifikasi kesesuaian hak akses (role) pengguna per route
  if (path.startsWith('/admin1') && !['admin', 'administrator', 'tu'].includes(userRole || '')) {
    return new NextResponse('Akses Ditolak: Anda tidak memiliki wewenang untuk membuka halaman ini.', { status: 403 });
  }

  if (path.startsWith('/bk') && !['bk', 'admin'].includes(userRole || '')) {
    return new NextResponse('Akses Ditolak: Anda tidak memiliki wewenang untuk membuka halaman ini.', { status: 403 });
  }

  if (path.startsWith('/osis') && !['osis', 'piket', 'admin'].includes(userRole || '')) {
    return new NextResponse('Akses Ditolak: Anda tidak memiliki wewenang untuk membuka halaman ini.', { status: 403 });
  }

  return NextResponse.next();
}

// Batasi middleware agar hanya berjalan pada rute yang membutuhkan autentikasi
export const config = {
  matcher: ['/admin1/:path*', '/bk/:path*', '/osis/:path*', '/dashboard/:path*'],
};