import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const forbidden = () =>
  new NextResponse('Akses ditolak: akun ini tidak memiliki wewenang untuk membuka halaman tersebut.', {
    status: 403,
  });

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Konfigurasi Supabase tidak tersedia untuk memvalidasi sesi.');
    return new NextResponse('Layanan autentikasi tidak tersedia.', { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginResponse = NextResponse.redirect(new URL('/', request.url));
    response.cookies.getAll().forEach((cookie) => loginResponse.cookies.set(cookie));
    return loginResponse;
  }

  const role = String(user.app_metadata?.role || '').trim().toLowerCase();
  const path = request.nextUrl.pathname;
  const isAdmin = ['admin', 'administrator', 'tu', 'tata usaha'].includes(role);

  if ((path.startsWith('/admin1') || path.startsWith('/admin')) && !isAdmin) return forbidden();
  if (path.startsWith('/bk') && !['bk', 'admin', 'administrator', 'tu'].includes(role)) return forbidden();
  if (path.startsWith('/piket') && !['piket', 'admin', 'administrator', 'tu'].includes(role)) return forbidden();

  const isBkWeeklyReport = path === '/osis/rekap-mingguan' && role === 'bk';
  if (
    path.startsWith('/osis') &&
    !['osis', 'mpk', 'piket', 'admin', 'administrator', 'tu'].includes(role) &&
    !isBkWeeklyReport
  ) {
    return forbidden();
  }

  if (path === '/siswa' && !['bk', 'admin', 'administrator', 'tu'].includes(role)) return forbidden();
  if (
    ['/dashboard', '/booking', '/curhat', '/jurnal', '/perizinan'].some((route) => path === route || path.startsWith(`${route}/`)) &&
    !['siswa', 'student'].includes(role)
  ) {
    return forbidden();
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin1/:path*',
    '/bk/:path*',
    '/osis/:path*',
    '/piket/:path*',
    '/siswa/:path*',
    '/dashboard/:path*',
    '/booking/:path*',
    '/curhat/:path*',
    '/jurnal/:path*',
    '/perizinan/:path*',
  ],
};
