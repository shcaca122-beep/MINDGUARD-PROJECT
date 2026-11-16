import { supabase } from '@/lib/supabase'; // Sesuaikan dengan path client supabase proyekmu

export type UserRole = 'siswa' | 'bk' | 'admin';

export interface AgregatItem {
  label: string;
  nilai: number | string;
  keterangan: string;
  sorotan?: boolean;
}

/**
 * Mengambil hasil kueri agregat secara dinamis berdasarkan role pengguna
 */
export async function fetchDashboardAgregat(
  role: UserRole,
  userId?: string
): Promise<{ data: AgregatItem[]; error: string | null }> {
  try {
    if (role === 'siswa' && userId) {
      // Ambil agregat khusus milik siswa yang sedang login (terlindungi RLS)
      const [curhatRes, bookingRes, poinRes] = await Promise.all([
        supabase
          .from('curhat_siswa')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('booking_konseling')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'disetujui'),
        supabase
          .from('pelanggaran_siswa')
          .select('poin')
          .eq('siswa_id', userId),
      ]);

      const totalPoin = (poinRes.data ?? []).reduce(
        (sum, row) => sum + (Number(row.poin) || 0),
        0
      );

      return {
        data: [
          {
            label: 'Total Curhat Terkirim',
            nilai: curhatRes.count ?? 0,
            keterangan: 'Riwayat curhat pribadi & anonim',
          },
          {
            label: 'Jadwal Konseling Aktif',
            nilai: bookingRes.count ?? 0,
            keterangan: 'Sesi bimbingan disetujui BK',
          },
          {
            label: 'Akumulasi Poin Kedisiplinan',
            nilai: `${totalPoin} Poin`,
            keterangan: totalPoin === 0 ? 'Catatan bersih' : 'Terpantau sistem',
            sorotan: totalPoin >= 25,
          },
        ],
        error: null,
      };
    }

    if (role === 'bk') {
      // Ambil agregat dari view/tabel curhat & konseling untuk Guru BK
      // Catatan: Jika sudah membuat SQL View (misal: v_curhat_aggregation), ganti .from('curhat_siswa') ke nama view tersebut
      const [totalCurhat, prioritasCurhat, bookingPending] = await Promise.all([
        supabase.from('curhat_siswa').select('id', { count: 'exact', head: true }),
        supabase
          .from('curhat_siswa')
          .select('id', { count: 'exact', head: true })
          .eq('is_urgent', true)
          .neq('status', 'selesai'),
        supabase
          .from('booking_konseling')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'menunggu'),
      ]);

      return {
        data: [
          {
            label: 'Total Curhat Masuk',
            nilai: totalCurhat.count ?? 0,
            keterangan: 'Seluruh laporan siswa terdata',
          },
          {
            label: 'Curhat Prioritas Mendesak',
            nilai: prioritasCurhat.count ?? 0,
            keterangan: 'Perlu segera ditangani BK',
            sorotan: (prioritasCurhat.count ?? 0) > 0,
          },
          {
            label: 'Permohonan Booking Baru',
            nilai: bookingPending.count ?? 0,
            keterangan: 'Menunggu verifikasi jadwal',
          },
        ],
        error: null,
      };
    }

    // Role: Admin (Ringkasan agregat lintas seluruh layanan sekolah)
    const [allCurhat, allPelanggaran, allBooking] = await Promise.all([
      supabase.from('curhat_siswa').select('id', { count: 'exact', head: true }),
      supabase.from('pelanggaran_siswa').select('poin'),
      supabase.from('booking_konseling').select('id', { count: 'exact', head: true }),
    ]);

    const akumulasiPoinSekolah = (allPelanggaran.data ?? []).reduce(
      (sum, row) => sum + (Number(row.poin) || 0),
      0
    );

    return {
      data: [
        {
          label: 'Total Laporan Curhat',
          nilai: allCurhat.count ?? 0,
          keterangan: 'Agregat seluruh angkatan',
        },
        {
          label: 'Total Sesi Konseling',
          nilai: allBooking.count ?? 0,
          keterangan: 'Reservasi layanan BK',
        },
        {
          label: 'Total Kasus Pelanggaran',
          nilai: allPelanggaran.data?.length ?? 0,
          keterangan: `Akumulasi ${akumulasiPoinSekolah} poin tercatat`,
        },
      ],
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      error: 'Gagal memuat ringkasan data agregat. Silakan muat ulang halaman.',
    };
  }
}

/**
 * Mengubah error duplikasi database (PostgreSQL code 23505) menjadi pesan peringatan ramah
 */
export function formatPesanDuplikasi(error: any, konteks = 'data'): string | null {
  if (!error) return null;

  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();

  if (
    code === '23505' ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint') ||
    msg.includes('sudah ada') ||
    msg.includes('sudah tercatat')
  ) {
    return `Oops! Pengajuan ${konteks} yang sama sudah tercatat sebelumnya di sistem. Untuk menghindari data ganda, silakan periksa daftar riwayat Anda atau gunakan pilihan yang berbeda.`;
  }

  return error?.message || `Terjadi kendala saat memproses ${konteks}.`;
}