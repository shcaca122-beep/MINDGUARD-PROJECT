import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'NISN atau password tidak valid.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const nisn = typeof input.nisn === 'string' ? input.nisn.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (!nisn || !password) {
      return NextResponse.json({ error: 'NISN dan password wajib diisi.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) {
      console.error('Konfigurasi Supabase server belum lengkap untuk login NISN.');
      return NextResponse.json({ error: 'Layanan login belum dikonfigurasi.' }, { status: 503 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const isStudentId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nisn);
    const studentLookup = isStudentId
      ? admin
        .from('users')
        .select('id,nisn')
        .eq('id', nisn)
        .limit(2)
      : admin
        .from('users')
        .select('id,nisn')
        .eq('nisn', nisn)
        .limit(2);
    const { data: students, error: studentError } = await studentLookup;
    if (studentError) {
      console.error('Gagal mencari akun siswa untuk login NISN:', studentError.message);
      return NextResponse.json({ error: 'Layanan login siswa sedang bermasalah.' }, { status: 503 });
    }
    if (!students?.length || students.length !== 1) {
      return NextResponse.json({ error: 'NISN atau password salah.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('user_id,role,display_name,student_record_id,kelas')
      .eq('student_record_id', students[0].id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'NISN atau password salah. Jika akun belum dimigrasikan, hubungi administrator.' }, { status: 401 });
    }

    const { data: authData, error: authUserError } = await admin.auth.admin.getUserById(profile.user_id);
    if (authUserError || !authData.user?.email) {
      console.error('Akun Auth siswa tidak ditemukan untuk profil:', profile.user_id);
      return NextResponse.json({ error: 'Akun belum siap untuk login. Hubungi administrator.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: sessionData, error: signInError } = await sessionClient.auth.signInWithPassword({
      email: authData.user.email,
      password,
    });
    if (signInError || !sessionData.user) {
      return NextResponse.json({ error: 'NISN atau password salah.' }, { status: 401 });
    }

    return NextResponse.json({
      userId: sessionData.user.id,
      email: sessionData.user.email,
      profile: {
        role: profile.role,
        display_name: profile.display_name,
        student_record_id: profile.student_record_id,
        kelas: profile.kelas,
      },
    });
  } catch (error) {
    console.error('Gagal memproses login NISN:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login gagal.' },
      { status: 500 },
    );
  }
}
