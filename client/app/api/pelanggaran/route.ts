import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * S2-03: Endpoint API Pencatatan Pelanggaran Siswa
 */
export async function POST(request: Request) {
  try {
    // 1. Parsing & Validasi Payload Data Request
    const body = await request.json();
    const { siswa_id, nama_siswa, kelas, jenis_pelanggaran, poin, pencatat, foto_bukti_path } = body;

    if (!nama_siswa || !jenis_pelanggaran || poin === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data tidak lengkap! Nama siswa, jenis pelanggaran, dan poin wajib diisi.',
        },
        { status: 400 }
      );
    }

    // 2. Insert Data ke Tabel Supabase PostgreSQL
    const { data, error } = await supabase
      .from('pelanggaran_siswa')
      .insert([
        {
          siswa_id: siswa_id || null,
          nama_siswa,
          kelas: kelas || '-',
          jenis_pelanggaran,
          poin: Number(poin),
          pencatat: pencatat || 'Petugas Piket',
          foto_bukti_path: foto_bukti_path || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    // 3. Return JSON Response Sukses (201 Created)
    return NextResponse.json(
      {
        success: true,
        message: 'Catatan pelanggaran berhasil disimpan.',
        data: data[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    // 4. Return JSON Response Gagal (500 Internal Server Error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan data pelanggaran ke database.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}