'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building, 
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type CounselingRecord = {
  layanan: string | null;
  tanggal: string | null;
  created_at: string | null;
};

function parseDatabaseDate(value?: string | null): Date | null {
  if (!value) return null;

  const isoDate = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1) return date;
    return null;
  }

  const localDate = value.match(/(?:^|\D)(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})(?:\D|$)/);
  if (localDate) {
    const [, day, month, year] = localDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1) return date;
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export default function AdminDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [monthlyData, setMonthlyData] = useState(() => MONTHS.map((month) => ({ month, val: 0 })));
  const [chartStatus, setChartStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [chartError, setChartError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadMonthlyData = async () => {
      try {
        const { data, error } = await supabase
          .from('layanan_siswa')
          .select('layanan, tanggal, created_at');

        if (error) throw error;

        const counts = Array.from({ length: 12 }, () => 0);
        for (const record of (data || []) as CounselingRecord[]) {
          const service = (record.layanan || '').trim().toUpperCase();
          if (service !== 'KONSELING' && service !== 'KELOMPOK') continue;

          const sessionDate = parseDatabaseDate(record.tanggal)
            || parseDatabaseDate(record.created_at);
          if (sessionDate?.getFullYear() === currentYear) {
            counts[sessionDate.getMonth()] += 1;
          }
        }

        if (isMounted) {
          setMonthlyData(MONTHS.map((month, index) => ({ month, val: counts[index] })));
          setChartStatus('ready');
        }
      } catch (error) {
        console.error('Gagal memuat grafik konseling:', error);
        if (isMounted) {
          setChartError(error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca data.');
          setChartStatus('error');
        }
      }
    };

    void loadMonthlyData();
    return () => {
      isMounted = false;
    };
  }, [currentYear]);

  const maxMonthlyCount = Math.max(...monthlyData.map((item) => item.val), 1);
  const hasMonthlyData = monthlyData.some((item) => item.val > 0);

  return (
    <div className="text-white font-sans antialiased">
      <div className="flex flex-col justify-between overflow-y-auto">
        <div>
          {/* HEADER DASHBOARD BANNER */}
          <div className="bg-[#032318] border border-[#09422e] rounded-xl p-4 mb-6 flex justify-between items-center shadow-lg">
            <h1 className="text-xl font-black tracking-wider text-white uppercase">
              DASHBOARD
            </h1>
            <span className="text-xs bg-[#064e3b] text-[#34d399] border border-[#34d399]/30 px-3 py-1 rounded-full font-bold">
              Panel Administrator
            </span>
          </div>

          {/* 4 CARDS KARTU UTAMA (SESUAI UI DESAIN) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'TOTAL SISWA', val: '0', link: '/admin1/siswa' },
              { label: 'TOTAL GURU BK', val: '1', link: '/admin1/guru' },
              { label: 'SESI KONSELING', val: '0', link: '/admin1/konseling' },
              { label: 'PELANGGARAN', val: '2', link: '/admin1/pelanggaran' },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-[#032318] border border-[#09422e] rounded-xl overflow-hidden flex flex-col justify-between shadow-md hover:border-[#34d399]/40 transition-all"
              >
                {/* HEAD CARD WITH BRIGHT TEAL GRADIENT */}
                <div className="bg-linear-to-r from-[#6ee7b7] to-[#34d399] p-4 text-[#021811]">
                  <h2 className="text-3xl font-black">{card.val}</h2>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider mt-1 opacity-90">
                    {card.label}
                  </p>
                </div>
                {/* FOOTER CARD */}
                <a
                  href={card.link}
                  className="bg-[#032318] hover:bg-[#052e20] p-3 text-[11px] font-bold text-[#34d399] flex items-center justify-between transition-colors border-t border-[#09422e]"
                >
                  <span>Lihat Detail</span>
                  <ChevronRight size={14} />
                </a>
              </div>
            ))}
          </div>

          {/* GRID TINGKAT DUA: GRAFIK & INFORMASI SEKOLAH */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRAFIK KONSELING BULANAN */}
            <div className="lg:col-span-2 bg-[#032318] border border-[#09422e] rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6 border-b border-[#09422e] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#34d399]" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Grafik Konseling Bulanan
                  </h3>
                </div>
                <span className="text-[10px] bg-[#052e20] text-[#34d399] border border-[#09422e] px-2.5 py-1 rounded font-bold">
                  Tahun {currentYear}
                </span>
              </div>

              {/* VISUALISASI BAR CHART */}
              <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-[#09422e]">
                {monthlyData.map((item, idx) => {
                  const heightPercent = item.val > 0 ? Math.max((item.val / maxMonthlyCount) * 100, 4) : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#34d399] mb-1 opacity-80 group-hover:opacity-100">
                        {item.val}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-6 bg-linear-to-t from-[#064e3b] to-[#34d399] rounded-t-sm group-hover:brightness-125 transition-all"
                      />
                      <span className="text-[10px] text-gray-400 mt-2 font-semibold">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p aria-live="polite" className="mt-3 text-xs text-emerald-300/70">
                {chartStatus === 'loading' && 'Memuat data konseling dari database...'}
                {chartStatus === 'error' && `Data grafik gagal dimuat: ${chartError}`}
                {chartStatus === 'ready' && !hasMonthlyData && `Belum ada data konseling untuk tahun ${currentYear}.`}
                {chartStatus === 'ready' && hasMonthlyData && 'Jumlah sesi dihitung dari tanggal jadwal di database.'}
              </p>
            </div>

            {/* INFORMASI SEKOLAH */}
            <div className="bg-[#032318] border border-[#09422e] rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 border-b border-[#09422e] pb-3">
                  <Building size={18} className="text-[#34d399]" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Informasi Sekolah
                  </h3>
                </div>

                <div className="space-y-5 text-xs">
                  <div>
                    <p className="text-[10px] text-[#34d399] font-bold uppercase tracking-wider">
                      NAMA SEKOLAH
                    </p>
                    <p className="font-extrabold text-white mt-1 text-sm">
                      SMK BUDI BAKTI CIWIDEY
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-[#34d399] font-bold uppercase tracking-wider">
                      ALAMAT
                    </p>
                    <p className="text-gray-300 mt-1 leading-relaxed">
                      Jl. Babakantiga No. 82, Ciwidey, Kab. Bandung, Jawa Barat 40973
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-[#34d399] font-bold uppercase tracking-wider">
                      KEPALA SEKOLAH
                    </p>
                    <p className="font-bold text-white mt-1">
                      Ahmad Fadhla Fauzan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BANYAK SAMA DENGAN ACUAN DESAIN */}
        <footer className="mt-8 pt-4 border-t border-[#09422e] text-center text-[11px] text-emerald-400/60 font-medium">
          © 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
        </footer>
      </div>
    </div>
  );
}