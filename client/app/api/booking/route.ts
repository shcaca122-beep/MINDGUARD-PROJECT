import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tanggal = String(body?.tanggal || '').trim();
    const sesi = String(body?.sesi || '').trim();
    const judulPesan = String(body?.judul_pesan || '').trim();
    const topik = String(body?.topik || '').trim();
    const namaSiswa = String(body?.nama_siswa || 'Siswa').trim();
    const emailSiswa = String(body?.email_siswa || '').trim();
    const kelas = String(body?.kelas || '').trim();

    // 1. Validasi input wajib & sanitasi
    if (!tanggal || !sesi || !judulPesan) {
      return NextResponse.json(
        { message: 'Tanggal sesi, jam sesi, dan topik utama wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. Cek bentrok / duplikasi jadwal pada tanggal dan sesi yang sama
    const { data: existingBooking, error: checkError } = await supabase
      .from('layanan_siswa')
      .select('id, status')
      .eq('layanan', 'BOOKING')
      .eq('tanggal', tanggal)
      .eq('sesi', sesi)
      .neq('status', 'DITOLAK')
      .maybeSingle();

    if (checkError && !checkError.message?.includes('column')) {
      return NextResponse.json(
        { message: 'Gagal memeriksa ketersediaan jadwal konseling.' },
        { status: 500 }
      );
    }

    if (existingBooking) {
      return NextResponse.json(
        {
          code: '23505',
          message: `Jadwal konseling pada ${tanggal} (${sesi}) sudah dibooking. Silakan pilih tanggal atau sesi jam lain.`,
        },
        { status: 409 }
      );
    }

    // 3. Susun payload penyimpanan ke tabel layanan_siswa
    const payload: Record<string, string> = {
      nama_siswa: namaSiswa,
      layanan: 'BOOKING',
      judul_pesan: judulPesan,
      topik: topik || judulPesan,
      deskripsi: topik || judulPesan,
      tanggal,
      sesi,
      status: 'TERKIRIM',
    };

    if (emailSiswa) payload.email_siswa = emailSiswa;
    if (kelas) payload.kelas = kelas;

    let { data, error } = await supabase
      .from('layanan_siswa')
      .insert([payload])
      .select()
      .single();

    // Fallback jika skema tabel belum memiliki kolom tanggal/sesi/deskripsi terpisah
    if (error && error.message?.includes('column')) {
      const fallbackPayload: Record<string, string> = {
        nama_siswa: namaSiswa,
        layanan: 'BOOKING',
        judul_pesan: `[${tanggal} | ${sesi}] ${judulPesan}`,
        topik: topik || judulPesan,
        status: 'TERKIRIM',
      };
      if (emailSiswa) fallbackPayload.email_siswa = emailSiswa;
      if (kelas) fallbackPayload.kelas = kelas;

      const retry = await supabase
        .from('layanan_siswa')
        .insert([fallbackPayload])
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    // 4. Tangkap error duplikasi dari UNIQUE INDEX database (kode PostgreSQL 23505)
    if (error) {
      if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json(
          {
            code: '23505',
            message:
              'Pengajuan jadwal konseling yang sama sudah tercatat sebelumnya. Silakan pilih sesi lain.',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: error.message || 'Gagal menyimpan permohonan konseling.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Permohonan jadwal konseling berhasil disimpan.',
        data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('API /api/booking error:', err);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server saat memproses booking.' },
      { status: 500 }
    );
  }
}