import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const noStore = { headers: { 'Cache-Control': 'no-store, max-age=0' } };
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase belum lengkap.' }, { status: 503, ...noStore });
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login kembali.' }, { status: 401, ...noStore });
    }

    const { data: profile, error: profileError } = await sessionClient
      .from('user_profiles')
      .select('role,student_record_id')
      .eq('user_id', user.id)
      .single();
    if (profileError || profile?.role !== 'siswa' || !profile.student_record_id) {
      return NextResponse.json({ error: 'Pendaftaran email ini hanya tersedia untuk akun siswa.' }, { status: 403, ...noStore });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400, ...noStore });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400, ...noStore });
    }
    const input = body as Record<string, unknown>;

    if (input.action === 'request') {
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      if (email.length > 254 || !validEmail(email)) {
        return NextResponse.json({ error: 'Masukkan alamat email Google yang valid.' }, { status: 400, ...noStore });
      }
      if (email === user.email?.toLowerCase()) {
        return NextResponse.json({ error: 'Alamat email ini sudah terhubung ke akun.' }, { status: 409, ...noStore });
      }

      const { error } = await sessionClient.auth.updateUser(
        { email },
        { emailRedirectTo: new URL('/akun/email', request.url).toString() },
      );
      if (error) {
        return NextResponse.json({ error: `Gagal mengirim verifikasi email: ${error.message}` }, { status: 400, ...noStore });
      }

      return NextResponse.json({ success: true }, noStore);
    }

    if (input.action === 'sync') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Konfigurasi layanan akun belum lengkap.' }, { status: 503, ...noStore });
      }
      if (!user.email || !user.email_confirmed_at) {
        return NextResponse.json({ error: 'Email Google belum diverifikasi.' }, { status: 409, ...noStore });
      }
      if (
        user.email.endsWith('@students.budibakti.sch.id') ||
        /^[0-9]{10}@budibakti\.sch\.id$/.test(user.email)
      ) {
        return NextResponse.json({ error: 'Email otomatis belum dapat digunakan untuk pemulihan.' }, { status: 409, ...noStore });
      }

      const adminClient = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const email = user.email.trim().toLowerCase();
      const { error: studentError } = await adminClient
        .from('users')
        .update({ email })
        .eq('id', profile.student_record_id);
      if (studentError) {
        console.error('Gagal menyimpan email Google siswa:', studentError.message);
        return NextResponse.json({ error: 'Email sudah diverifikasi, tetapi profil siswa gagal diperbarui. Hubungi administrator.' }, { status: 500, ...noStore });
      }

      const { error: profileUpdateError } = await adminClient
        .from('user_profiles')
        .update({ email })
        .eq('user_id', user.id);
      if (profileUpdateError) {
        console.error('Gagal menyinkronkan email profil siswa:', profileUpdateError.message);
        return NextResponse.json({ error: 'Email sudah diverifikasi, tetapi profil akun gagal diperbarui. Hubungi administrator.' }, { status: 500, ...noStore });
      }

      return NextResponse.json({ success: true, email }, noStore);
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400, ...noStore });
  } catch (error) {
    console.error('Gagal memproses email pemulihan siswa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memproses email pemulihan.' },
      { status: 500, ...noStore },
    );
  }
}
