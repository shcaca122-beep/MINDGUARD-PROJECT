import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tanggal = String(body?.tanggal || '').trim();
    const sesi = String(body?.sesi || '').trim();
    const judulPesan = String(body?.judul_pesan || '').trim();
    const topik = String(body?.topik || '').trim();
    const deskripsi = String(body?.deskripsi || topik || judulPesan).trim();
    const namaSiswa = String(body?.nama_siswa || 'Siswa').trim();
    const emailSiswa = String(body?.email_siswa || '').trim();
    const kelas = String(body?.kelas || '').trim();

    if (!tanggal || !sesi || !judulPesan) {
      return NextResponse.json(
        { message: 'Tanggal sesi, jam sesi, dan topik utama wajib diisi.' },
        { status: 400 }
      );
    }

    const slotPrefix = `[${tanggal} | ${sesi}]`;

    // 1. Cek bentrok jadwal berdasarkan format judul_pesan "[tanggal | sesi]%"
    const { data: existingBySlot, error: checkSlotError } = await supabase
      .from('layanan_siswa')
      .select('id, status')
      .in('layanan', ['KONSELING', 'BOOKING'])
      .ilike('judul_pesan', `${slotPrefix}%`)
      .neq('status', 'DITOLAK')
      .limit(1);

    if (!checkSlotError && existingBySlot && existingBySlot.length > 0) {
      return NextResponse.json(
        {
          code: '23505',
          message: `Jadwal konseling pada ${tanggal} (${sesi}) sudah tercatat sebelumnya. Silakan pilih tanggal atau sesi jam lain.`,
        },
        { status: 409 }
      );
    }

    // 2. Cek bentrok jadwal jika tabel memiliki kolom tanggal & sesi terpisah
    const { data: existingByCol, error: checkColError } = await supabase
      .from('layanan_siswa')
      .select('id, status')
      .in('layanan', ['KONSELING', 'BOOKING'])
      .eq('tanggal', tanggal)
      .eq('sesi', sesi)
      .neq('status', 'DITOLAK')
      .limit(1);

    if (!checkColError && existingByCol && existingByCol.length > 0) {
      return NextResponse.json(
        {
          code: '23505',
          message: `Jadwal konseling pada ${tanggal} (${sesi}) sudah tercatat sebelumnya. Silakan pilih tanggal atau sesi jam lain.`,
        },
        { status: 409 }
      );
    }

    // 3. Simpan ke tabel layanan_siswa dengan layanan = 'KONSELING'
    const payload: Record<string, string> = {
      nama_siswa: namaSiswa,
      layanan: 'KONSELING',
      judul_pesan: `${slotPrefix} ${judulPesan}`,
      topik: topik || judulPesan,
      deskripsi,
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

    // Fallback jika tabel layanan_siswa belum memiliki kolom tanggal/sesi/deskripsi terpisah
    if (error && error.message?.includes('column')) {
      const fallbackPayload: Record<string, string> = {
        nama_siswa: namaSiswa,
        layanan: 'KONSELING',
        judul_pesan: `${slotPrefix} ${judulPesan}`,
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

    // 4. Tangkap error duplikasi dari UNIQUE INDEX (23505) atau Trigger SQL (P0001)
    if (error) {
      const errMsg = (error.message || '').toLowerCase();
      if (
        error.code === '23505' ||
        error.code === 'P0001' ||
        errMsg.includes('duplicate') ||
        errMsg.includes('duplikat') ||
        errMsg.includes('sudah')
      ) {
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
      { message: 'Permohonan jadwal konseling berhasil disimpan.', data },
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