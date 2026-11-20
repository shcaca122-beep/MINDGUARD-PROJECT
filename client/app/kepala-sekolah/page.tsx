'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, CalendarDays, LogOut, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ActivityRecord = {
  id?: string | number;
  nama_siswa?: string | null;
  kelas?: string | null;
  layanan?: string | null;
  jenis_izin?: string | null;
  jenis_pelanggaran?: string | null;
  keterangan?: string | null;
  keperluan?: string | null;
  alasan?: string | null;
  jam_datang?: string | null;
  status?: string | null;
  tanggal?: string | null;
  created_at?: string | null;
};

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  date: string;
  type: 'layanan' | 'pelanggaran' | 'surat';
};

type DashboardData = {
  totalStudents: number;
  totalServices: number;
  totalViolations: number;
  totalParentCalls: number;
  totalHomeVisits: number;
  totalLateness: number;
  totalPermissions: number;
  activities: ActivityItem[];
};

const emptyDashboard: DashboardData = {
  totalStudents: 0,
  totalServices: 0,
  totalViolations: 0,
  totalParentCalls: 0,
  totalHomeVisits: 0,
  totalLateness: 0,
  totalPermissions: 0,
  activities: [],
};

function activityDate(record: ActivityRecord): string {
  return record.created_at || record.tanggal || '';
}

function displayDate(value: string): string {
  if (!value) return 'Tanggal tidak tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function KepalaSekolahPage() {
  const router = useRouter();
  const [data, setData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const rawSession = localStorage.getItem('user_session');
    if (!rawSession) {
      router.replace('/');
      return;
    }

    try {
      const session = JSON.parse(rawSession) as { role?: string };
      if (String(session.role || '').trim().toLowerCase() !== 'kepala_sekolah') {
        router.replace('/dashboard');
        return;
      }
      queueMicrotask(() => setIsAuthorized(true));
    } catch {
      localStorage.removeItem('user_session');
      router.replace('/');
    }
  }, [router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [students, services, violations, legacyViolations, parentCalls, homeVisits, lateness, permissions] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).or('role.is.null,role.ilike.%siswa%'),
        supabase.from('layanan_siswa').select('id,layanan,nama_siswa,kelas,status,tanggal,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('pelanggaran_siswa').select('id,nama_siswa,kelas,jenis_pelanggaran,keterangan,status,tanggal,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('pelanggaran').select('id,nama_siswa,kelas,jenis_pelanggaran,keterangan,tanggal,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('panggilan_ortu').select('id,nama_siswa,kelas,keperluan,alasan,status,tanggal,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('home_visit').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('keterlambatan').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        supabase.from('perizinan_siswa').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
      ]);

      const failedResult = [students, services, violations, legacyViolations, parentCalls, homeVisits, lateness, permissions].find((result) => result.error);
      if (failedResult?.error) throw failedResult.error;

      const serviceItems: ActivityItem[] = (services.data || []).map((record) => ({
        id: `layanan-${record.id}`,
        label: (record.layanan || 'Layanan siswa').toUpperCase(),
        detail: (record.layanan || '').toUpperCase() === 'CURHAT'
          ? 'Aktivitas curhat siswa (rincian bersifat rahasia)'
          : `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.status || 'Tercatat'}`,
        date: activityDate(record),
        type: 'layanan',
      }));
      const violationItems: ActivityItem[] = (violations.data || []).map((record) => ({
        id: `pelanggaran-${record.id}`,
        label: 'Pelanggaran siswa',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.jenis_pelanggaran || record.keterangan || 'Catatan pelanggaran'}`,
        date: activityDate(record),
        type: 'pelanggaran',
      }));
      const legacyViolationItems: ActivityItem[] = (legacyViolations.data || []).map((record) => ({
        id: `pelanggaran-legacy-${record.id}`,
        label: 'Pelanggaran siswa',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.jenis_pelanggaran || record.keterangan || 'Catatan pelanggaran'}`,
        date: activityDate(record),
        type: 'pelanggaran',
      }));
      const callItems: ActivityItem[] = (parentCalls.data || []).map((record) => ({
        id: `surat-${record.id}`,
        label: 'Surat panggilan orang tua',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.keperluan || record.alasan || 'Surat dibuat'}`,
        date: activityDate(record),
        type: 'surat',
      }));
      const homeVisitItems: ActivityItem[] = ((homeVisits.data || []) as ActivityRecord[]).map((record) => ({
        id: `home-visit-${record.id}`,
        label: 'Kunjungan rumah',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.alasan || record.keterangan || record.status || 'Aktivitas tercatat'}`,
        date: activityDate(record),
        type: 'layanan',
      }));
      const latenessItems: ActivityItem[] = ((lateness.data || []) as ActivityRecord[]).map((record) => ({
        id: `terlambat-${record.id}`,
        label: 'Catatan keterlambatan',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.jam_datang || record.alasan || record.keterangan || 'Keterlambatan tercatat'}`,
        date: activityDate(record),
        type: 'pelanggaran',
      }));
      const permissionItems: ActivityItem[] = ((permissions.data || []) as ActivityRecord[]).map((record) => ({
        id: `izin-${record.id}`,
        label: 'Permohonan izin',
        detail: `${record.nama_siswa || 'Siswa'}${record.kelas ? ` · ${record.kelas}` : ''} · ${record.jenis_izin || record.alasan || record.status || 'Permohonan tercatat'}`,
        date: activityDate(record),
        type: 'layanan',
      }));
      const activities = [...serviceItems, ...violationItems, ...legacyViolationItems, ...callItems, ...homeVisitItems, ...latenessItems, ...permissionItems]
        .sort((first, second) => new Date(second.date || 0).getTime() - new Date(first.date || 0).getTime())
        .slice(0, 20);

      setData({
        totalStudents: students.count || 0,
        totalServices: services.count || 0,
        totalViolations: (violations.count || 0) + (legacyViolations.count || 0),
        totalParentCalls: parentCalls.count || 0,
        totalHomeVisits: homeVisits.count || 0,
        totalLateness: lateness.count || 0,
        totalPermissions: permissions.count || 0,
        activities,
      });
    } catch (error) {
      console.error('Gagal memuat panel kepala sekolah:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat aktivitas sekolah.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
    router.replace('/');
  };

  useEffect(() => {
    if (!isAuthorized) return;
    const initialLoad = window.setTimeout(() => void loadDashboard(), 0);

    const channel = supabase
      .channel('principal-activity-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'layanan_siswa' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran_siswa' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pelanggaran' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'panggilan_ortu' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_visit' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keterlambatan' }, () => void loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perizinan_siswa' }, () => void loadDashboard())
      .subscribe();
    const refreshInterval = window.setInterval(() => void loadDashboard(), 30_000);

    return () => {
      window.clearInterval(refreshInterval);
      window.clearTimeout(initialLoad);
      void supabase.removeChannel(channel);
    };
  }, [isAuthorized, loadDashboard]);

  if (!isAuthorized) return null;

  const cards = [
    { label: 'Total Siswa', value: data.totalStudents, Icon: Users, tone: '#34d399' },
    { label: 'Aktivitas Layanan', value: data.totalServices, Icon: Activity, tone: '#38bdf8' },
    { label: 'Catatan Pelanggaran', value: data.totalViolations, Icon: AlertTriangle, tone: '#fbbf24' },
    { label: 'Surat Panggilan', value: data.totalParentCalls, Icon: CalendarDays, tone: '#c4b5fd' },
    { label: 'Kunjungan Rumah', value: data.totalHomeVisits, Icon: Activity, tone: '#fb7185' },
    { label: 'Keterlambatan', value: data.totalLateness, Icon: AlertTriangle, tone: '#f97316' },
    { label: 'Permohonan Izin', value: data.totalPermissions, Icon: CalendarDays, tone: '#60a5fa' },
  ];

  return (
    <main className="min-h-screen bg-[#07100d] p-4 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-900 bg-[#0e1a15] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">MindGuard · Pemantauan sekolah</p>
            <h1 className="mt-1 text-2xl font-black text-white">Panel Kepala Sekolah</h1>
            <p className="mt-1 text-sm text-slate-400">Ringkasan aktivitas siswa, layanan BK, pelanggaran, dan surat panggilan.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Memuat...' : 'Segarkan'}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </header>

        {errorMessage && (
          <p role="alert" className="mb-5 rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
            Gagal memuat sebagian data dashboard: {errorMessage}
          </p>
        )}

        <section aria-label="Ringkasan sekolah" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-emerald-950 bg-[#0e1a15] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{label}</p>
                <Icon size={19} style={{ color: tone }} />
              </div>
              <p className="mt-3 text-3xl font-black text-white">{loading ? '…' : value.toLocaleString('id-ID')}</p>
              <p className="mt-1 text-xs text-slate-500">Data terkini dari sistem</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-emerald-950 bg-[#0e1a15]">
          <div className="border-b border-emerald-950 px-5 py-4">
            <h2 className="font-bold text-white">Aktivitas Terbaru</h2>
            <p className="mt-1 text-xs text-slate-400">Diperbarui otomatis setiap 30 detik. Isi curhat tidak ditampilkan demi privasi siswa.</p>
          </div>
          {loading && data.activities.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Memuat aktivitas sekolah...</p>
          ) : data.activities.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Belum ada aktivitas yang tercatat.</p>
          ) : (
            <ol className="divide-y divide-emerald-950">
              {data.activities.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-200">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-500">{displayDate(item.date)}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
