import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const noStore = { headers: { 'Cache-Control': 'no-store, max-age=0' } };

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('Konfigurasi Supabase server belum lengkap.');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Password baru tidak valid.' }, { status: 400, ...noStore });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Password baru tidak valid.' }, { status: 400, ...noStore });
    }
    const input = body as Record<string, unknown>;
    const password = typeof input.password === 'string' ? input.password : '';
    if (password.length < 12) {
      return NextResponse.json({ error: 'Password pribadi harus minimal 12 karakter.' }, { status: 400, ...noStore });
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: { user }, error: sessionError } = await sessionClient.auth.getUser();
    if (sessionError || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login ulang.' }, { status: 401, ...noStore });
    }
    if (user.app_metadata?.password_reset_required !== true) {
      return NextResponse.json({ error: 'Akun ini tidak sedang menunggu penggantian password.' }, { status: 409, ...noStore });
    }

    const { data: profile, error: profileError } = await sessionClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (profileError || profile?.role !== 'siswa') {
      return NextResponse.json({ error: 'Penggantian mandiri hanya tersedia untuk akun siswa.' }, { status: 403, ...noStore });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: { ...user.app_metadata, password_reset_required: false },
    });
    if (updateError) {
      return NextResponse.json({ error: `Gagal menyimpan password baru: ${updateError.message}` }, { status: 400, ...noStore });
    }

    const { error: refreshError } = await sessionClient.auth.refreshSession();
    if (refreshError) {
      return NextResponse.json({
        error: 'Password baru sudah disimpan, tetapi sesi tidak dapat diperbarui. Silakan login ulang menggunakan password baru.',
        reLoginRequired: true,
      }, { status: 503, ...noStore });
    }

    return NextResponse.json({ success: true }, noStore);
  } catch (error) {
    console.error('Gagal menyelesaikan penggantian password:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan password baru.' },
      { status: 500, ...noStore },
    );
  }
}
