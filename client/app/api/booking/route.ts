import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_OPTIONS = [
  '08:00 - 09:00 WIB (Sesi 1)',
  '10:00 - 11:00 WIB (Sesi 2)',
  '13:00 - 14:00 WIB (Sesi 3)',
] as const;

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) {
      console.error('Konfigurasi Supabase server belum lengkap untuk booking konseling.');
      return NextResponse.json({ message: 'Layanan booking belum dikonfigurasi.' }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Format permintaan tidak valid.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Data booking tidak valid.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const tanggal = typeof input.tanggal === 'string' ? input.tanggal : '';
    const sesi = typeof input.sesi === 'string' ? input.sesi : '';
    const judulPesan = typeof input.judul_pesan === 'string' ? input.judul_pesan.trim() : '';
    const topik = typeof input.topik === 'string' ? input.topik.trim() : '';
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? new Date(`${tanggal}T00:00:00.000Z`) : null;

    if (
      !parsedDate ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== tanggal ||
      !(SESSION_OPTIONS as readonly string[]).includes(sesi) ||
      !judulPesan ||
      !topik
    ) {
      return NextResponse.json({ message: 'Tanggal, sesi, topik, atau judul booking tidak valid.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ message: 'Sesi login tidak valid. Silakan masuk kembali.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await sessionClient
      .from('user_profiles')
      .select('role, display_name, kelas')
      .eq('user_id', user.id)
      .single();
    if (profileError || profile?.role !== 'siswa') {
      return NextResponse.json({ message: 'Hanya akun siswa yang dapat mengajukan booking konseling.' }, { status: 403 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: booked, error: bookingError } = await adminClient.rpc('book_counseling_slot', {
      p_email_siswa: user.email,
      p_nama_siswa: profile.display_name || user.email,
      p_kelas: profile.kelas || '-',
      p_tanggal: `${tanggal} (${sesi})`,
      p_judul_pesan: judulPesan,
      p_topik: topik,
    });

    if (bookingError) {
      console.error('Gagal menyimpan booking konseling:', bookingError.message);
      return NextResponse.json({ message: 'Booking konseling gagal disimpan. Silakan coba lagi.' }, { status: 503 });
    }
    if (booked === false) {
      return NextResponse.json(
        { message: 'Jadwal konseling tersebut sudah dipesan. Silakan pilih tanggal atau sesi lain.' },
        { status: 409 },
      );
    }
    if (booked !== true) {
      console.error('Respons tidak valid dari penyimpanan booking konseling.');
      return NextResponse.json({ message: 'Booking konseling gagal disimpan. Silakan coba lagi.' }, { status: 503 });
    }

    return NextResponse.json({ success: true, message: 'Jadwal konseling berhasil diajukan.' }, { status: 201 });
  } catch (error: unknown) {
    console.error('Gagal memproses booking konseling:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengirim booking konseling.' }, { status: 500 });
  }
}
