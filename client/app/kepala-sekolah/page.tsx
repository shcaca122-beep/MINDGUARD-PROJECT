'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  Eye,
  Home,
  Image as ImageIcon,
  Loader2,
  LogOut,
  PhoneCall,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type StudentServiceRow = {
  id?: string | number;
  layanan?: string | null;
  jenis?: string | null;
  nama?: string | null;
  nama_siswa?: string | null;
  kelas?: string | null;
  topik?: string | null;
  deskripsi?: string | null;
  alasan?: string | null;
  keterangan?: string | null;
  judul_pesan?: string | null;
  status?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
};

type ViolationRow = {
  id?: string | number;
  nama_siswa?: string | null;
  kelas?: string | null;
  jenis_pelanggaran?: string | null;
  jenis?: string | null;
  kategori?: string | null;
  keterangan?: string | null;
  poin?: number | null;
  pencatat?: string | null;
  status?: string | null;
  foto_bukti_path?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
  source?: 'pelanggaran_siswa' | 'pelanggaran';
};

type ParentCallRow = {
  id?: string | number;
  nama_siswa?: string | null;
  nama?: string | null;
  kelas?: string | null;
  keperluan?: string | null;
  alasan?: string | null;
  pukul?: string | null;
  status?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
};

type HomeVisitRow = {
  id?: string | number;
  nama_siswa?: string | null;
  nama?: string | null;
  kelas?: string | null;
  alamat?: string | null;
  alasan?: string | null;
  tujuan?: string | null;
  keterangan?: string | null;
  petugas?: string | null;
  status?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
};

type LatenessRow = {
  id?: string | number;
  nama_siswa?: string | null;
  nama?: string | null;
  kelas?: string | null;
  jam_datang?: string | null;
  waktu?: string | null;
  alasan?: string | null;
  keterangan?: string | null;
  pencatat?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
};

type UnifiedActivityItem = {
  id: string;
  unit:
    | 'LAYANAN BK'
    | 'PELANGGARAN'
    | 'PANGGILAN ORTU'
    | 'HOME VISIT'
    | 'KETERLAMBATAN';
  siswa: string;
  kelas: string;
  detail: string;
  status: string;
  date: string;
  timestamp: number;
  badgeBg: string;
  badgeColor: string;
};

type TabKey =
  | 'semua'
  | 'pelanggaran'
  | 'panggilan'
  | 'layanan'
  | 'home_visit'
  | 'keterlambatan';

function getRawDate(record: { created_at?: string | null; tanggal?: string | null }): string {
  return record.created_at || record.tanggal || '';
}

function getTimestamp(record: { created_at?: string | null; tanggal?: string | null }): number {
  const candidates = [record.created_at, record.tanggal];
  for (const val of candidates) {
    if (!val) continue;
    const ms = new Date(val).getTime();
    if (!Number.isNaN(ms)) return ms;
  }
  return 0;
}

function formatDateDisplay(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function isCurhatService(row: StudentServiceRow): boolean {
  return `${row.layanan || ''} ${row.jenis || ''}`.toUpperCase().includes('CURHAT');
}

function getServiceDetail(row: StudentServiceRow): string {
  return (
    row.topik ||
    row.judul_pesan ||
    row.deskripsi ||
    row.alasan ||
    row.keterangan ||
    'Sesi konseling siswa'
  );
}

export default function KepalaSekolahPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [namaKepsek, setNamaKepsek] = useState('Kepala Sekolah');
  const [loading, setLoading] = useState(true);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);

  // Filter & Navigasi Tab
  const [activeTab, setActiveTab] = useState<TabKey>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('SEMUA');

  // Counts & Datasets dari Supabase
  const [totalStudents, setTotalStudents] = useState(0);
  const [counts, setCounts] = useState({
    services: 0,
    violations: 0,
    parentCalls: 0,
    homeVisits: 0,
    lateness: 0,
  });

  const [servicesList, setServicesList] = useState<StudentServiceRow[]>([]);
  const [violationsList, setViolationsList] = useState<ViolationRow[]>([]);
  const [parentCallsList, setParentCallsList] = useState<ParentCallRow[]>([]);
  const [homeVisitsList, setHomeVisitsList] = useState<HomeVisitRow[]>([]);
  const [latenessList, setLatenessList] = useState<LatenessRow[]>([]);

  // Modal Pratinjau Foto Bukti Pelanggaran
  const [viewBuktiUrl, setViewBuktiUrl] = useState<string | null>(null);
  const [loadingBuktiId, setLoadingBuktiId] = useState<string | null>(null);

  useEffect(() => {
    const rawSession = localStorage.getItem('user_session');
    if (!rawSession) {
      router.replace('/');
      return;
    }

    try {
      const session = JSON.parse(rawSession) as { role?: string; nama?: string };
      const role = String(session.role || '').trim().toLowerCase();
      if (role !== 'kepala_sekolah' && role !== 'kepsek' && role !== 'admin') {
        router.replace('/dashboard');
        return;
      }

      queueMicrotask(() => {
        if (session.nama) setNamaKepsek(session.nama);
        setIsAuthorized(true);
      });
    } catch {
      localStorage.removeItem('user_session');
      router.replace('/');
    }
  }, [router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const warnings: string[] = [];

    try {
      const [
        students,
        services,
        violations,
        legacyViolations,
        parentCalls,
        homeVisits,
        lateness,
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .or('role.is.null,role.ilike.%siswa%'),
        supabase
          .from('layanan_siswa')
          .select(
            'id,layanan,jenis,nama,nama_siswa,kelas,topik,deskripsi,alasan,keterangan,judul_pesan,status,tanggal,created_at',
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('pelanggaran_siswa')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('pelanggaran')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('panggilan_ortu')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('home_visit')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('keterlambatan')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (students.error) warnings.push(`users: ${students.error.message}`);
      else setTotalStudents(students.count || 0);

      if (services.error) warnings.push(`layanan_siswa: ${services.error.message}`);
      else setServicesList((services.data || []) as StudentServiceRow[]);

      const mergedViolations: ViolationRow[] = [];
      if (violations.error) {
        warnings.push(`pelanggaran_siswa: ${violations.error.message}`);
      } else {
        ((violations.data || []) as ViolationRow[]).forEach((row) =>
          mergedViolations.push({ ...row, source: 'pelanggaran_siswa' })
        );
      }

      if (!legacyViolations.error) {
        ((legacyViolations.data || []) as ViolationRow[]).forEach((row) =>
          mergedViolations.push({ ...row, source: 'pelanggaran' })
        );
      }

      mergedViolations.sort((a, b) => getTimestamp(b) - getTimestamp(a));
      setViolationsList(mergedViolations);

      if (parentCalls.error) warnings.push(`panggilan_ortu: ${parentCalls.error.message}`);
      else setParentCallsList((parentCalls.data || []) as ParentCallRow[]);

      if (homeVisits.error) warnings.push(`home_visit: ${homeVisits.error.message}`);
      else setHomeVisitsList((homeVisits.data || []) as HomeVisitRow[]);

      if (lateness.error) warnings.push(`keterlambatan: ${lateness.error.message}`);
      else setLatenessList((lateness.data || []) as LatenessRow[]);

      setCounts({
        services: services.count || 0,
        violations: (violations.count || 0) + (legacyViolations.count || 0),
        parentCalls: parentCalls.count || 0,
        homeVisits: homeVisits.count || 0,
        lateness: lateness.count || 0,
      });

      setWarningMessages(warnings);
    } catch (error) {
      console.error('Gagal memuat panel kepala sekolah:', error);
      setWarningMessages([
        error instanceof Error ? error.message : 'Gagal memuat aktivitas sekolah.',
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const initialLoad = window.setTimeout(() => void loadDashboard(), 0);

    const channel = supabase
      .channel('principal-activity-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'layanan_siswa' }, () =>
        void loadDashboard()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran_siswa' }, () =>
        void loadDashboard()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran' }, () =>
        void loadDashboard()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panggilan_ortu' }, () =>
        void loadDashboard()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_visit' }, () =>
        void loadDashboard()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keterlambatan' }, () =>
        void loadDashboard()
      )
      .subscribe();

    const refreshInterval = window.setInterval(() => void loadDashboard(), 30_000);

    return () => {
      window.clearInterval(refreshInterval);
      window.clearTimeout(initialLoad);
      void supabase.removeChannel(channel);
    };
  }, [isAuthorized, loadDashboard]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
    router.replace('/');
  };

  const handleOpenBukti = async (path: string, itemKey: string) => {
    if (!path) return;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      setViewBuktiUrl(path);
      return;
    }
    setLoadingBuktiId(itemKey);
    try {
      const { data: signedData, error } = await supabase.storage
        .from('bukti-pelanggaran')
        .createSignedUrl(path, 3600);
      if (error) throw error;
      setViewBuktiUrl(signedData.signedUrl);
    } catch (err) {
      alert(
        `Gagal membuka foto bukti: ${err instanceof Error ? err.message : 'Terjadi kesalahan.'}`
      );
    } finally {
      setLoadingBuktiId(null);
    }
  };

  // Daftar kelas unik untuk dropdown filter
  const daftarKelas = useMemo(() => {
    const setKelas = new Set<string>();
    const addKelas = (val?: string | null) => {
      const cleaned = (val || '').trim();
      if (cleaned && cleaned !== '-') setKelas.add(cleaned);
    };
    servicesList.forEach((r) => addKelas(r.kelas));
    violationsList.forEach((r) => addKelas(r.kelas));
    parentCallsList.forEach((r) => addKelas(r.kelas));
    homeVisitsList.forEach((r) => addKelas(r.kelas));
    latenessList.forEach((r) => addKelas(r.kelas));
    return ['SEMUA', ...Array.from(setKelas).sort()];
  }, [homeVisitsList, latenessList, parentCallsList, servicesList, violationsList]);

  // Helper filter kelas & kata kunci
  const matchesFilter = useCallback(
    (kelasVal?: string | null, ...fields: Array<string | number | null | undefined>) => {
      if (
        selectedKelas !== 'SEMUA' &&
        (kelasVal || '').trim().toLowerCase() !== selectedKelas.toLowerCase()
      ) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return fields.some((field) => String(field || '').toLowerCase().includes(q));
    },
    [searchQuery, selectedKelas]
  );

  const filteredViolations = useMemo(
    () =>
      violationsList.filter((r) =>
        matchesFilter(
          r.kelas,
          r.nama_siswa,
          r.kelas,
          r.jenis_pelanggaran,
          r.jenis,
          r.keterangan,
          r.pencatat
        )
      ),
    [matchesFilter, violationsList]
  );

  const filteredParentCalls = useMemo(
    () =>
      parentCallsList.filter((r) =>
        matchesFilter(
          r.kelas,
          r.nama_siswa || r.nama,
          r.kelas,
          r.keperluan,
          r.alasan,
          r.status
        )
      ),
    [matchesFilter, parentCallsList]
  );

  const filteredServices = useMemo(
    () =>
      servicesList.filter((r) => {
        const curhat = isCurhatService(r);
        return matchesFilter(
          r.kelas,
          r.layanan,
          r.jenis,
          curhat ? 'Curhat siswa (rahasia)' : r.nama_siswa || r.nama,
          r.kelas,
          curhat ? '' : getServiceDetail(r),
          r.status
        );
      }),
    [matchesFilter, servicesList]
  );

  const filteredHomeVisits = useMemo(
    () =>
      homeVisitsList.filter((r) =>
        matchesFilter(
          r.kelas,
          r.nama_siswa || r.nama,
          r.kelas,
          r.tujuan,
          r.alasan,
          r.keterangan,
          r.petugas,
          r.status
        )
      ),
    [homeVisitsList, matchesFilter]
  );

  const filteredLateness = useMemo(
    () =>
      latenessList.filter((r) =>
        matchesFilter(
          r.kelas,
          r.nama_siswa || r.nama,
          r.kelas,
          r.alasan,
          r.keterangan,
          r.pencatat
        )
      ),
    [latenessList, matchesFilter]
  );

  // Feed Terpadu Seluruh Aktivitas Sekolah (dengan privasi CURHAT terjaga)
  const unifiedActivities = useMemo<UnifiedActivityItem[]>(() => {
    const items: UnifiedActivityItem[] = [];

    filteredServices.forEach((record, idx) => {
      const curhat = isCurhatService(record);
      const jenisLabel = (record.layanan || record.jenis || 'KONSELING').toUpperCase();
      items.push({
        id: `layanan-${record.id ?? idx}`,
        unit: 'LAYANAN BK',
        siswa: curhat
          ? 'Siswa (Identitas Dirahasiakan)'
          : record.nama_siswa || record.nama || 'Siswa',
        kelas: curhat ? 'Privasi BK' : record.kelas || '-',
        detail: curhat
          ? 'Aktivitas curhat siswa (rincian bersifat rahasia)'
          : `${jenisLabel} · ${getServiceDetail(record)}`,
        status: record.status || 'TERCATAT',
        date: getRawDate(record),
        timestamp: getTimestamp(record),
        badgeBg: 'rgba(14, 116, 144, 0.35)',
        badgeColor: '#67e8f9',
      });
    });

    filteredViolations.forEach((record, idx) => {
      items.push({
        id: `pelanggaran-${record.source}-${record.id ?? idx}`,
        unit: 'PELANGGARAN',
        siswa: record.nama_siswa || 'Siswa',
        kelas: record.kelas || '-',
        detail: `${record.jenis_pelanggaran || record.jenis || record.keterangan || 'Catatan pelanggaran'}${record.poin ? ` (+${record.poin} Poin)` : ''}`,
        status: record.status || 'TERCATAT',
        date: getRawDate(record),
        timestamp: getTimestamp(record),
        badgeBg: 'rgba(127, 29, 29, 0.45)',
        badgeColor: '#fca5a5',
      });
    });

    filteredParentCalls.forEach((record, idx) => {
      items.push({
        id: `surat-${record.id ?? idx}`,
        unit: 'PANGGILAN ORTU',
        siswa: record.nama_siswa || record.nama || 'Siswa',
        kelas: record.kelas || '-',
        detail: `${record.keperluan || record.alasan || 'Surat panggilan orang tua'}${record.tanggal ? ` (Jadwal: ${record.tanggal})` : ''}`,
        status: record.status || 'DITERBITKAN',
        date: getRawDate(record),
        timestamp: getTimestamp(record),
        badgeBg: 'rgba(120, 53, 15, 0.45)',
        badgeColor: '#fde68a',
      });
    });

    filteredHomeVisits.forEach((record, idx) => {
      items.push({
        id: `home-visit-${record.id ?? idx}`,
        unit: 'HOME VISIT',
        siswa: record.nama_siswa || record.nama || 'Siswa',
        kelas: record.kelas || '-',
        detail: record.tujuan || record.alasan || record.keterangan || 'Kunjungan rumah siswa',
        status: record.status || 'TERLAKSANA',
        date: getRawDate(record),
        timestamp: getTimestamp(record),
        badgeBg: 'rgba(136, 19, 55, 0.45)',
        badgeColor: '#fda4af',
      });
    });

    filteredLateness.forEach((record, idx) => {
      items.push({
        id: `terlambat-${record.id ?? idx}`,
        unit: 'KETERLAMBATAN',
        siswa: record.nama_siswa || record.nama || 'Siswa',
        kelas: record.kelas || '-',
        detail: `${record.alasan || record.keterangan || 'Terlambat masuk sekolah'}${record.jam_datang || record.waktu ? ` (${record.jam_datang || record.waktu})` : ''}`,
        status: 'TERCATAT',
        date: getRawDate(record),
        timestamp: getTimestamp(record),
        badgeBg: 'rgba(124, 45, 18, 0.45)',
        badgeColor: '#fdba74',
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [
    filteredHomeVisits,
    filteredLateness,
    filteredParentCalls,
    filteredServices,
    filteredViolations,
  ]);

  // Analitik Peringkat Kelas (berdasarkan jumlah pelanggaran & poin)
  const topKelasStats = useMemo(() => {
    const map = new Map<string, { kasus: number; poin: number }>();
    violationsList.forEach((row) => {
      const k = (row.kelas || 'Tanpa Kelas').trim();
      const prev = map.get(k) || { kasus: 0, poin: 0 };
      map.set(k, {
        kasus: prev.kasus + 1,
        poin: prev.poin + (Number(row.poin) || 0),
      });
    });
    return Array.from(map.entries())
      .map(([kelasName, val]) => ({ kelas: kelasName, ...val }))
      .sort((a, b) => b.poin - a.poin || b.kasus - a.kasus)
      .slice(0, 5);
  }, [violationsList]);

  const maxKelasMetric = topKelasStats[0]?.poin || topKelasStats[0]?.kasus || 1;

  // Analitik Jenis Pelanggaran Terbanyak
  const topJenisStats = useMemo(() => {
    const map = new Map<string, number>();
    violationsList.forEach((row) => {
      const label = (
        row.jenis_pelanggaran ||
        row.jenis ||
        row.kategori ||
        row.keterangan ||
        'Lainnya'
      ).trim();
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
  }, [violationsList]);

  const maxJenisJumlah = topJenisStats[0]?.jumlah || 1;

  const handleExportCsv = () => {
    const headers = ['Unit', 'Nama Siswa', 'Kelas', 'Rincian Aktivitas', 'Status', 'Waktu'];
    const rows = unifiedActivities.map((item) => [
      item.unit,
      item.siswa,
      item.kelas,
      item.detail,
      item.status,
      formatDateDisplay(item.date),
    ]);
    const csvContent = [headers, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan-Monitoring-Kepsek-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthorized) return null;

  const cards = [
    {
      label: 'Total Siswa',
      value: totalStudents,
      Icon: Users,
      tone: '#34d399',
      sub: 'Siswa terdaftar aktif',
    },
    {
      label: 'Aktivitas Layanan BK',
      value: counts.services,
      Icon: Activity,
      tone: '#38bdf8',
      sub: 'Konseling & curhat siswa',
    },
    {
      label: 'Catatan Pelanggaran',
      value: counts.violations,
      Icon: AlertTriangle,
      tone: '#fbbf24',
      sub: 'Laporan OSIS, Piket & BK',
    },
    {
      label: 'Surat Panggilan Ortu',
      value: counts.parentCalls,
      Icon: PhoneCall,
      tone: '#c4b5fd',
      sub: 'Pemanggilan wali terbit',
    },
    {
      label: 'Kunjungan Rumah',
      value: counts.homeVisits,
      Icon: Home,
      tone: '#fb7185',
      sub: 'Agenda Home Visit BK',
    },
    {
      label: 'Keterlambatan',
      value: counts.lateness,
      Icon: Clock,
      tone: '#f97316',
      sub: 'Presensi gerbang pagi',
    },
  ];

  const tabs: Array<{ id: TabKey; label: string; count: number }> = [
    { id: 'semua', label: 'Semua Aktivitas', count: unifiedActivities.length },
    { id: 'pelanggaran', label: 'Pelanggaran', count: filteredViolations.length },
    { id: 'panggilan', label: 'Panggilan Ortu', count: filteredParentCalls.length },
    { id: 'layanan', label: 'Layanan BK', count: filteredServices.length },
    { id: 'home_visit', label: 'Home Visit', count: filteredHomeVisits.length },
    { id: 'keterlambatan', label: 'Keterlambatan', count: filteredLateness.length },
  ];

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 14mm 15mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* ==================== TAMPILAN LAYAR (INTERAKTIF) ==================== */}
      <div className="flex min-h-screen bg-[#07100d] text-slate-100 print:hidden">
        <div className="shrink-0 border-r border-emerald-950 bg-[#021f18]">
          <Sidebar />
        </div>

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-6xl">
            {/* HEADER */}
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-900 bg-[#0e1a15] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                  MindGuard · Pemantauan Terpusat Sekolah
                </p>
                <h1 className="mt-1 text-2xl font-black text-white">Panel Kepala Sekolah</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Aktif sebagai <strong className="text-emerald-200">{namaKepsek}</strong> · Pantauan
                  real-time kedisiplinan, layanan BK, panggilan wali, dan keterlambatan siswa.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-800 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Memuat...' : 'Segarkan'}
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-900/60"
                >
                  <Download size={15} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <Printer size={15} /> Cetak Laporan
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            </header>

            {/* PERINGATAN JIKA ADA TABEL YANG GAGAL DIBACA */}
            {warningMessages.length > 0 && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-amber-700/70 bg-amber-950/40 p-4 text-xs text-amber-200"
              >
                <strong className="block font-bold">Catatan akses sebagian tabel:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {warningMessages.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6 KARTU KPI RINGKASAN SEKOLAH (GRID 3x2) */}
            <section
              aria-label="Ringkasan sekolah"
              className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {cards.map(({ label, value, Icon, tone, sub }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-emerald-950 bg-[#0e1a15] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400">{label}</p>
                    <Icon size={18} style={{ color: tone }} />
                  </div>
                  <p className="mt-2.5 text-2xl font-black text-white">
                    {loading ? '…' : value.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
                </article>
              ))}
            </section>

            {/* ANALITIK PERINGKAT KELAS & KATEGORI PELANGGARAN */}
            <section className="mb-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-emerald-950 bg-[#0e1a15] p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">
                    Kelas dengan Akumulasi Pelanggaran Tertinggi
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Prioritas pembinaan wali kelas dan ketertiban siswa
                </p>

                {topKelasStats.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">Belum ada data pelanggaran tercatat.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {topKelasStats.map((row) => {
                      const metric = row.poin > 0 ? row.poin : row.kasus;
                      return (
                        <div key={row.kelas}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-bold text-slate-200">{row.kelas}</span>
                            <span className="font-semibold text-amber-300">
                              {row.poin > 0 ? `${row.poin} Poin · ` : ''}
                              {row.kasus} kasus
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                              style={{ width: `${Math.max(8, (metric / maxKelasMetric) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-emerald-950 bg-[#0e1a15] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Jenis Pelanggaran Terbanyak</h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Kategori pelanggaran yang paling sering muncul di lapangan
                </p>

                {topJenisStats.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">Belum ada data jenis pelanggaran.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {topJenisStats.map((row) => (
                      <div key={row.nama}>
                        <div className="mb-1 flex justify-between gap-3 text-xs">
                          <span className="truncate font-semibold text-slate-200">{row.nama}</span>
                          <span className="shrink-0 font-bold text-emerald-300">{row.jumlah}x</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{
                              width: `${Math.max(8, (row.jumlah / maxJenisJumlah) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            {/* AREA PEMANTAUAN LINTAS UNIT DENGAN TAB & FILTER */}
            <section className="overflow-hidden rounded-2xl border border-emerald-950 bg-[#0e1a15]">
              <div className="border-b border-emerald-950 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-white">Pemantauan Aktivitas Sekolah</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Diperbarui otomatis setiap 30 detik. Isi pesan curhat tidak ditampilkan demi
                      privasi siswa.
                    </p>
                  </div>

                  {/* FILTER KELAS & PENCARIAN */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      aria-label="Filter kelas"
                      className="rounded-lg border border-emerald-900 bg-[#07100d] px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                    >
                      {daftarKelas.map((kls) => (
                        <option key={kls} value={kls}>
                          {kls === 'SEMUA' ? 'Semua Kelas' : kls}
                        </option>
                      ))}
                    </select>

                    <div className="relative">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari siswa, petugas, keterangan..."
                        className="w-60 rounded-lg border border-emerald-900 bg-[#07100d] py-2 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* NAVIGASI TAB */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        activeTab === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'border border-emerald-950 bg-[#07100d] text-slate-300 hover:border-emerald-800'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: SEMUA AKTIVITAS GABUNGAN */}
              {activeTab === 'semua' && (
                <>
                  {loading && unifiedActivities.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">Memuat aktivitas sekolah...</p>
                  ) : unifiedActivities.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">
                      Tidak ada aktivitas yang cocok dengan filter saat ini.
                    </p>
                  ) : (
                    <ol className="divide-y divide-emerald-950">
                      {unifiedActivities.slice(0, 60).map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wide"
                                style={{
                                  backgroundColor: item.badgeBg,
                                  color: item.badgeColor,
                                }}
                              >
                                {item.unit}
                              </span>
                              <span className="text-sm font-bold text-white">{item.siswa}</span>
                              <span className="text-xs text-slate-400">· {item.kelas}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <span className="inline-block rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              {item.status}
                            </span>
                            <time className="mt-1 block text-xs text-slate-500">
                              {formatDateDisplay(item.date)}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}

              {/* TAB 2: PELANGGARAN */}
              {activeTab === 'pelanggaran' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-950 bg-[#07100d] text-emerald-300">
                        <th className="px-4 py-3">Siswa & Kelas</th>
                        <th className="px-4 py-3">Pelanggaran</th>
                        <th className="px-4 py-3">Poin</th>
                        <th className="px-4 py-3">Pencatat</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950">
                      {filteredViolations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            Tidak ada catatan pelanggaran ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredViolations.map((row, idx) => {
                          const key = `${row.source}-${row.id ?? idx}`;
                          return (
                            <tr key={key}>
                              <td className="px-4 py-3">
                                <strong className="block text-white">
                                  {row.nama_siswa || 'Siswa'}
                                </strong>
                                <span className="text-slate-400">{row.kelas || '-'}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-200">
                                {row.jenis_pelanggaran ||
                                  row.jenis ||
                                  row.keterangan ||
                                  'Pelanggaran'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded bg-rose-950 px-2 py-0.5 font-bold text-rose-300">
                                  +{row.poin ?? 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-emerald-300">
                                {row.pencatat || 'OSIS / Piket'}
                              </td>
                              <td className="px-4 py-3 text-slate-400">
                                {formatDateDisplay(getRawDate(row))}
                              </td>
                              <td className="px-4 py-3">
                                {row.foto_bukti_path ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenBukti(row.foto_bukti_path!, key)}
                                    disabled={loadingBuktiId === key}
                                    className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950 px-2.5 py-1 font-bold text-emerald-300 hover:bg-emerald-900"
                                  >
                                    {loadingBuktiId === key ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Eye size={12} />
                                    )}
                                    Foto
                                  </button>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PANGGILAN ORANG TUA */}
              {activeTab === 'panggilan' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-950 bg-[#07100d] text-emerald-300">
                        <th className="px-4 py-3">Siswa & Kelas</th>
                        <th className="px-4 py-3">Keperluan Pemanggilan</th>
                        <th className="px-4 py-3">Jadwal Hadir</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950">
                      {filteredParentCalls.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            Belum ada surat panggilan orang tua.
                          </td>
                        </tr>
                      ) : (
                        filteredParentCalls.map((row, idx) => (
                          <tr key={String(row.id ?? idx)}>
                            <td className="px-4 py-3">
                              <strong className="block text-white">
                                {row.nama_siswa || row.nama || 'Siswa'}
                              </strong>
                              <span className="text-slate-400">{row.kelas || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              {row.keperluan || row.alasan || '-'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-sky-300">
                              {row.tanggal || '-'} {row.pukul ? `· ${row.pukul} WIB` : ''}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-amber-950 px-2 py-0.5 font-bold text-amber-300">
                                {row.status || 'DITERBITKAN'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: LAYANAN BK (PRIVASI CURHAT TETAP TERJAGA) */}
              {activeTab === 'layanan' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-950 bg-[#07100d] text-emerald-300">
                        <th className="px-4 py-3">Jenis Layanan</th>
                        <th className="px-4 py-3">Siswa & Kelas</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950">
                      {filteredServices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            Belum ada data layanan BK.
                          </td>
                        </tr>
                      ) : (
                        filteredServices.map((row, idx) => {
                          const curhat = isCurhatService(row);
                          return (
                            <tr key={String(row.id ?? idx)}>
                              <td className="px-4 py-3 font-bold text-sky-300">
                                {(row.layanan || row.jenis || 'LAYANAN').toUpperCase()}
                              </td>
                              <td className="px-4 py-3">
                                {curhat ? (
                                  <span className="italic text-slate-400">
                                    Dirahasiakan (Kode Etik BK)
                                  </span>
                                ) : (
                                  <>
                                    <strong className="block text-white">
                                      {row.nama_siswa || row.nama || 'Siswa'}
                                    </strong>
                                    <span className="text-slate-400">{row.kelas || '-'}</span>
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-200">
                                {curhat
                                  ? 'Aktivitas curhat siswa (rincian bersifat rahasia)'
                                  : getServiceDetail(row)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded bg-emerald-950 px-2 py-0.5 font-bold text-emerald-300">
                                  {row.status || 'TERCATAT'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400">
                                {formatDateDisplay(getRawDate(row))}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: HOME VISIT */}
              {activeTab === 'home_visit' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-950 bg-[#07100d] text-emerald-300">
                        <th className="px-4 py-3">Siswa & Kelas</th>
                        <th className="px-4 py-3">Tujuan / Alasan Kunjungan</th>
                        <th className="px-4 py-3">Petugas BK</th>
                        <th className="px-4 py-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950">
                      {filteredHomeVisits.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            Belum ada data kunjungan rumah.
                          </td>
                        </tr>
                      ) : (
                        filteredHomeVisits.map((row, idx) => (
                          <tr key={String(row.id ?? idx)}>
                            <td className="px-4 py-3">
                              <strong className="block text-white">
                                {row.nama_siswa || row.nama || 'Siswa'}
                              </strong>
                              <span className="text-slate-400">{row.kelas || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              {row.tujuan || row.alasan || row.keterangan || '-'}
                            </td>
                            <td className="px-4 py-3 text-emerald-300">
                              {row.petugas || 'Tim BK'}
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {formatDateDisplay(getRawDate(row))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 6: KETERLAMBATAN */}
              {activeTab === 'keterlambatan' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-emerald-950 bg-[#07100d] text-emerald-300">
                        <th className="px-4 py-3">Siswa & Kelas</th>
                        <th className="px-4 py-3">Jam Datang / Alasan</th>
                        <th className="px-4 py-3">Pencatat</th>
                        <th className="px-4 py-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950">
                      {filteredLateness.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            Belum ada catatan keterlambatan.
                          </td>
                        </tr>
                      ) : (
                        filteredLateness.map((row, idx) => (
                          <tr key={String(row.id ?? idx)}>
                            <td className="px-4 py-3">
                              <strong className="block text-white">
                                {row.nama_siswa || row.nama || 'Siswa'}
                              </strong>
                              <span className="text-slate-400">{row.kelas || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              {row.jam_datang || row.waktu ? `${row.jam_datang || row.waktu} · ` : ''}
                              {row.alasan || row.keterangan || 'Terlambat hadir'}
                            </td>
                            <td className="px-4 py-3 text-orange-300">
                              {row.pencatat || 'OSIS / Piket'}
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {formatDateDisplay(getRawDate(row))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* ==================== TAMPILAN CETAK RESMI A4 ==================== */}
      <div className="hidden bg-white text-slate-900 print:block">
        {/* KOP SURAT LAPORAN */}
        <header className="border-b-2 border-slate-900 pb-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Sistem Informasi Kedisiplinan &amp; Bimbingan Konseling (MindGuard)
          </p>
          <h1 className="mt-1 text-xl font-black uppercase tracking-wide text-slate-950">
            SMK BUDI BAKTI CIWIDEY
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-700">
            LAPORAN PEMANTAUAN TERPUSAT KESISWAAN, KEDISIPLINAN &amp; LAYANAN BK
          </p>
        </header>

        {/* METADATA CETAK */}
        <div className="mt-3 flex justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-700">
          <div>
            <p>
              <strong>Pejabat Pemantau:</strong> {namaKepsek}
            </p>
            <p>
              <strong>Cakupan Kelas:</strong>{' '}
              {selectedKelas === 'SEMUA' ? 'Seluruh Kelas Aktif' : selectedKelas}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Tanggal Cetak:</strong> {tanggalCetak}
            </p>
            <p>
              <strong>Total Aktivitas Terdata:</strong> {unifiedActivities.length} catatan
            </p>
          </div>
        </div>

        {/* I. TABEL RINGKASAN STATISTIK */}
        <section className="mt-4">
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
            I. Ringkasan Statistik Sekolah
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-400 px-2.5 py-1.5">Indikator Pemantauan</th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-right">Jumlah</th>
                <th className="border border-slate-400 px-2.5 py-1.5">Keterangan Unit</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((item) => (
                <tr key={item.label}>
                  <td className="border border-slate-400 px-2.5 py-1 font-semibold">
                    {item.label}
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1 text-right font-bold">
                    {item.value.toLocaleString('id-ID')}
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1 text-slate-700">
                    {item.sub}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* II. ANALISIS PRIORITAS PEMBINAAN (2 KOLOM) */}
        <section className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
              II.A. Kelas dengan Akumulasi Pelanggaran Tertinggi
            </h2>
            <table className="w-full border-collapse border border-slate-400 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-400 px-2 py-1">Kelas</th>
                  <th className="border border-slate-400 px-2 py-1 text-right">Kasus</th>
                  <th className="border border-slate-400 px-2 py-1 text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {topKelasStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-slate-400 px-2 py-1.5 text-center text-slate-500"
                    >
                      Belum ada data pelanggaran.
                    </td>
                  </tr>
                ) : (
                  topKelasStats.map((row) => (
                    <tr key={row.kelas}>
                      <td className="border border-slate-400 px-2 py-1 font-semibold">
                        {row.kelas}
                      </td>
                      <td className="border border-slate-400 px-2 py-1 text-right">
                        {row.kasus}
                      </td>
                      <td className="border border-slate-400 px-2 py-1 text-right font-bold">
                        {row.poin}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
              II.B. Jenis Pelanggaran Terbanyak
            </h2>
            <table className="w-full border-collapse border border-slate-400 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-400 px-2 py-1">Kategori Pelanggaran</th>
                  <th className="border border-slate-400 px-2 py-1 text-right">Frekuensi</th>
                </tr>
              </thead>
              <tbody>
                {topJenisStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="border border-slate-400 px-2 py-1.5 text-center text-slate-500"
                    >
                      Belum ada data jenis pelanggaran.
                    </td>
                  </tr>
                ) : (
                  topJenisStats.map((row) => (
                    <tr key={row.nama}>
                      <td className="border border-slate-400 px-2 py-1">{row.nama}</td>
                      <td className="border border-slate-400 px-2 py-1 text-right font-bold">
                        {row.jumlah}x
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* III. REKAPITULASI AKTIVITAS LINTAS UNIT */}
        <section className="mt-4">
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
            III. Rekapitulasi Aktivitas Terbaru Lintas Unit
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-400 px-2 py-1 text-center">No</th>
                <th className="border border-slate-400 px-2 py-1">Unit</th>
                <th className="border border-slate-400 px-2 py-1">Nama Siswa</th>
                <th className="border border-slate-400 px-2 py-1">Kelas</th>
                <th className="border border-slate-400 px-2 py-1">Rincian Aktivitas</th>
                <th className="border border-slate-400 px-2 py-1">Status</th>
                <th className="border border-slate-400 px-2 py-1">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {unifiedActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-slate-400 px-2 py-2 text-center text-slate-500"
                  >
                    Tidak ada aktivitas pada cakupan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                unifiedActivities.slice(0, 35).map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 px-2 py-1 font-semibold">{item.unit}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.siswa}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.kelas}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.detail}</td>
                    <td className="border border-slate-400 px-2 py-1">{item.status}</td>
                    <td className="border border-slate-400 px-2 py-1 whitespace-nowrap">
                      {formatDateDisplay(item.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="mt-1 text-[9px] italic text-slate-600">
            * Catatan: Identitas dan isi layanan curhat siswa disamarkan sesuai kode etik kerahasiaan
            Bimbingan Konseling.
          </p>
        </section>

        {/* BLOK TANDA TANGAN PENGESAHAN */}
        <footer className="mt-8 flex justify-end break-inside-avoid text-xs">
          <div className="w-60 text-center">
            <p>Ciwidey, {tanggalCetak}</p>
            <p className="mt-0.5 font-semibold">Mengetahui, Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline">{namaKepsek}</p>
            <p className="text-[11px] text-slate-600">SMK Budi Bakti Ciwidey</p>
          </div>
        </footer>
      </div>

      {/* MODAL PREVIEW FOTO BUKTI PELANGGARAN */}
      {viewBuktiUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:hidden"
          onClick={() => setViewBuktiUrl(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-800 bg-[#0e1a15]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-950 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <ImageIcon size={16} className="text-emerald-400" /> Foto Bukti Pelanggaran
              </span>
              <button
                type="button"
                onClick={() => setViewBuktiUrl(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center bg-[#07100d] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewBuktiUrl}
                alt="Bukti pelanggaran siswa"
                className="max-h-[65vh] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}