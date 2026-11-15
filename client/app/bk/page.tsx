'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BKUtilityBar from './BKUtilityBar';
import { supabase } from '@/lib/supabase';
import { isHighPriorityMessage } from '@/lib/counseling-priority';
import { ShieldCheck, AlertTriangle, ArrowRight, UserCheck, X, Calendar, MessageSquareText } from 'lucide-react';

type StudentServiceRecord = {
  id?: string | number;
  layanan?: string;
  nama_siswa?: string;
  kelas?: string;
  tanggal?: string;
  judul_pesan?: string;
  pesan?: string;
  deskripsi?: string;
  topik?: string;
  status?: string;
  created_at?: string;
};

type ViolationRecord = {
  id?: string | number;
  nama_siswa?: string;
  kelas?: string;
  jenis_pelanggaran?: string;
  kategori?: string;
  jenis?: string;
  poin?: number;
  tanggal?: string;
  created_at?: string;
  pencatat?: string;
};

type ServiceNotification = {
  id: string;
  message: string;
  urgent: boolean;
  tab: 'curhat' | 'konseling';
};

export default function BKPage() {
  const router = useRouter();
  const [dataCurhat, setDataCurhat] = useState<StudentServiceRecord[]>([]);
  const [dataKonseling, setDataKonseling] = useState<StudentServiceRecord[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<ViolationRecord[]>([]);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [tabAktif, setTabAktif] = useState<'curhat' | 'konseling'>('curhat');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const permohonanKonselingRef = useRef<HTMLDivElement>(null);

  // State untuk Input Nama Guru BK Manual & Notifikasi Modern (Default "Umum")
  const [namaGuruBK, setNamaGuruBK] = useState('Umum');
  const [inputNama, setInputNama] = useState('Umum');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [serviceNotification, setServiceNotification] = useState<ServiceNotification | null>(null);
  const seenServiceIds = useRef(new Set<string>());
  const hasInitialServiceData = useRef(false);
  const [dismissedUrgentCurhatIds, setDismissedUrgentCurhatIds] = useState<string[]>([]);
  const [dismissedUrgentCounselingIds, setDismissedUrgentCounselingIds] = useState<string[]>([]);

  const announceNewService = useCallback((record: StudentServiceRecord) => {
    const id = String(record.id || '');
    if (!id || seenServiceIds.current.has(id)) return;
    seenServiceIds.current.add(id);
    const urgent = isHighPriorityMessage(record.judul_pesan, record.pesan, record.topik, record.deskripsi);
    const isCounseling = record.layanan === 'KONSELING';
    setServiceNotification({
      id,
      urgent,
      tab: isCounseling ? 'konseling' : 'curhat',
      message: urgent
        ? 'Ada pesan siswa bertanda prioritas yang perlu segera ditinjau.'
        : isCounseling
          ? 'Ada permohonan konseling baru dari siswa.'
          : 'Ada curhat baru dari siswa.',
    });
  }, []);

  const fetchDataBK = useCallback(async (notifyNew = false) => {
    setIsLoading(true);
    try {
      const [curhatResult, counselingResult, violationResult] = await Promise.all([
        supabase.from('layanan_siswa').select('*').eq('layanan', 'CURHAT').order('created_at', { ascending: false }),
        supabase.from('layanan_siswa').select('*').eq('layanan', 'KONSELING').order('created_at', { ascending: false }),
        supabase.from('pelanggaran_siswa').select('*').order('created_at', { ascending: false }),
      ]);
      const curhat = (curhatResult.data || []) as StudentServiceRecord[];
      const counseling = (counselingResult.data || []) as StudentServiceRecord[];
      const records = [...curhat, ...counseling]
        .sort((first, second) => new Date(first.created_at || 0).getTime() - new Date(second.created_at || 0).getTime());

      if (notifyNew && hasInitialServiceData.current) {
        records.forEach(announceNewService);
      } else {
        records.forEach((record) => {
          if (record.id) seenServiceIds.current.add(String(record.id));
        });
      }
      hasInitialServiceData.current = true;
      setDataCurhat(curhat);
      setDataKonseling(counseling);
      if (!violationResult.error) setDataPelanggaran(violationResult.data || []);
    } catch (err) {
      console.error('Gagal mengambil data BK:', err);
    } finally {
      setIsLoading(false);
    }
  }, [announceNewService]);

  // 1. Cek Hak Akses & Load Nama Tersimpan
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      const sessionData = localStorage.getItem('user_session') || localStorage.getItem('admin_session');

      if (!sessionData) {
        router.push('/');
        return;
      }

      try {
        const parsed = JSON.parse(sessionData);
        const userRole = (parsed.role || '').toLowerCase();

        if (!userRole.includes('bk') && !userRole.includes('admin')) {
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true);

        const savedName = localStorage.getItem('bk_custom_name');
        if (savedName) {
          setNamaGuruBK(savedName);
          setInputNama(savedName);
        } else if (parsed.nama) {
          setNamaGuruBK(parsed.nama);
          setInputNama(parsed.nama);
        }
      } catch (err) {
        console.error('Error memverifikasi sesi:', err);
        router.push('/');
      }
    });
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const initialLoad = window.setTimeout(() => void fetchDataBK(false), 0);
    const channel = supabase
      .channel('bk-student-service-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'layanan_siswa' }, (payload) => {
        const record = payload.new as StudentServiceRecord;
        if (record.layanan !== 'CURHAT' && record.layanan !== 'KONSELING') return;
        announceNewService(record);
        if (record.layanan === 'CURHAT') {
          setDataCurhat((current) => [record, ...current.filter((item) => item.id !== record.id)]);
        } else {
          setDataKonseling((current) => [record, ...current.filter((item) => item.id !== record.id)]);
        }
      })
      .subscribe();
    const refreshInterval = window.setInterval(() => void fetchDataBK(true), 25_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [announceNewService, fetchDataBK, isAuthorized]);

  const handleSimpanNamaManual = () => {
    if (!inputNama.trim()) {
      setStatusMsg({ type: 'error', message: 'Nama Guru BK tidak boleh kosong!' });
      return;
    }

    setNamaGuruBK(inputNama);
    localStorage.setItem('bk_custom_name', inputNama);

    ['user_session', 'admin_session'].forEach((key) => {
      const sess = localStorage.getItem(key);
      if (sess) {
        try {
          const parsed = JSON.parse(sess);
          parsed.nama = inputNama;
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch {}
      } else {
        localStorage.setItem(key, JSON.stringify({ nama: inputNama, role: 'BK' }));
      }
    });

    setStatusMsg({ type: 'success', message: 'Nama Guru BK berhasil disimpan!' });
    
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const urgentCurhatItems = dataCurhat.filter((item) =>
    isHighPriorityMessage(item.judul_pesan, item.pesan, item.topik, item.deskripsi)
    && !['DIBALAS', 'SELESAI'].includes((item.status || '').toUpperCase())
  );
  const urgentCurhatCount = urgentCurhatItems.length;
  const pendingCounselingCount = dataKonseling.filter((item) =>
    !['DISETUJUI', 'DIBALAS', 'SELESAI', 'DITOLAK', 'DIBATALKAN'].includes((item.status || 'MENUNGGU ACC').toUpperCase())
  ).length;
  const urgentCounselingItems = dataKonseling.filter((item) =>
    isHighPriorityMessage(item.judul_pesan, item.pesan, item.topik, item.deskripsi)
    && !['DISETUJUI', 'DIBALAS', 'SELESAI', 'DITOLAK', 'DIBATALKAN'].includes((item.status || 'MENUNGGU ACC').toUpperCase())
  );
  const urgentCounselingCount = urgentCounselingItems.length;
  const normalizedSearch = dashboardSearch.trim().toLowerCase();
  const matchesDashboardSearch = (...values: (string | number | undefined)[]) =>
    !normalizedSearch || values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  const filteredCurhat = dataCurhat.filter((item) =>
    matchesDashboardSearch(item.nama_siswa, item.kelas, item.judul_pesan, item.topik, item.status)
  );
  const filteredKonseling = dataKonseling.filter((item) =>
    matchesDashboardSearch(item.nama_siswa, item.kelas, item.judul_pesan, item.topik, item.status, item.tanggal)
  );
  const filteredPelanggaran = dataPelanggaran.filter((item) =>
    matchesDashboardSearch(item.nama_siswa, item.kelas, item.jenis_pelanggaran, item.kategori, item.jenis, item.pencatat)
  );
  const categoryCounts = dataPelanggaran.reduce<Record<string, number>>((counts, item) => {
    const category = (item.kategori || item.jenis_pelanggaran || item.jenis || 'Lainnya').trim() || 'Lainnya';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const categoryStats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCategoryCount = categoryStats[0]?.[1] || 1;
  const followUpCount = urgentCurhatCount + pendingCounselingCount;
  const isUrgentCurhatPopupOpen = urgentCurhatItems.some(
    (item) => !dismissedUrgentCurhatIds.includes(String(item.id))
  );
  const dismissUrgentCurhatPopup = () => {
    setDismissedUrgentCurhatIds((dismissedIds) => [
      ...new Set([
        ...dismissedIds,
        ...urgentCurhatItems.map((item) => String(item.id)),
      ]),
    ]);
  };
  const isUrgentCounselingPopupOpen = urgentCounselingItems.some(
    (item) => !dismissedUrgentCounselingIds.includes(String(item.id))
  );
  const dismissUrgentCounselingPopup = () => {
    setDismissedUrgentCounselingIds((dismissedIds) => [
      ...new Set([
        ...dismissedIds,
        ...urgentCounselingItems.map((item) => String(item.id)),
      ]),
    ]);
  };

  const bukaPermohonanKonseling = () => {
    dismissUrgentCounselingPopup();
    setTabAktif('konseling');
    window.requestAnimationFrame(() => {
      permohonanKonselingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const bukaCurhatPrioritas = () => {
    dismissUrgentCurhatPopup();
    setTabAktif('curhat');
  };


  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#021f18', fontWeight: 'bold', color: '#34d399', fontFamily: 'system-ui' }}>
        ⌛ Memeriksa Hak Akses...
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      {/* STRUKTUR UTAMA: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div className="bk-panel-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div className="bk-panel-sidebar" style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div className="bk-panel-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <BKUtilityBar
            currentRoute="Beranda"
            searchValue={dashboardSearch}
            searchPlaceholder="Cari siswa, topik, kelas, atau status..."
            onSearchChange={setDashboardSearch}
            onRefresh={() => fetchDataBK(true)}
            isRefreshing={isLoading}
          />

          {/* TOP BAR BK */}
          <div className="bk-route-heading" style={{
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#34d399" />
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Panel Guru Bimbingan Konseling (BK)
                </h2>
                <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '500' }}>Aktif Sebagai: <strong style={{ color: '#ffffff' }}>{namaGuruBK}</strong></span>
              </div>
            </div>
          </div>

          {/* KONTEN UTAMA BK - SIMETRIS DI TENGAH */}
          <div className="bk-panel-content" style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* NOTIFIKASI MODERN BANNER */}
            {statusMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', fontSize: '13.5px', backgroundColor: statusMsg.type === 'success' ? '#064e3b' : '#7f1d1d', color: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#f87171'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <span>{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{statusMsg.message}</span>
              </div>
            )}

            {urgentCurhatCount > 0 && (
              <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', padding: '14px 18px', marginBottom: '18px', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.55)', background: 'rgba(127, 29, 29, 0.28)', color: '#fee2e2', boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#f87171" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>Perlu ditinjau segera</strong>
                    <span style={{ fontSize: '12px' }}>{urgentCurhatCount} curhat siswa ditandai prioritas dan belum ditindaklanjuti.</span>
                  </div>
                </div>
                <button type="button" onClick={() => setTabAktif('curhat')} style={{ padding: '8px 12px', border: '1px solid rgba(248, 113, 113, 0.55)', borderRadius: '7px', background: 'rgba(127, 29, 29, 0.45)', color: '#fee2e2', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Buka curhat prioritas</button>
              </div>
            )}

            {pendingCounselingCount > 0 && (
              <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', padding: '13px 17px', marginBottom: '18px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.3)', background: 'rgba(2, 31, 24, 0.85)', color: '#a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Calendar size={18} color="#34d399" />
                  <strong style={{ fontSize: '12px' }}>{pendingCounselingCount} permohonan konseling menunggu verifikasi.</strong>
                </div>
                <button type="button" onClick={bukaPermohonanKonseling} style={{ padding: '7px 11px', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)', color: '#a7f3d0', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Lihat permohonan</button>
              </div>
            )}

            {serviceNotification && (
              <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', marginBottom: '18px', borderRadius: '10px', border: `1px solid ${serviceNotification.urgent ? 'rgba(248, 113, 113, 0.5)' : 'rgba(52, 211, 153, 0.3)'}`, background: serviceNotification.urgent ? 'rgba(127, 29, 29, 0.2)' : 'rgba(2, 31, 24, 0.85)', color: serviceNotification.urgent ? '#fee2e2' : '#a7f3d0' }}>
                {serviceNotification.urgent ? <AlertTriangle size={18} color="#f87171" /> : <ShieldCheck size={18} color="#34d399" />}
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>{serviceNotification.message}</span>
                <button type="button" onClick={() => { setTabAktif(serviceNotification.tab); setServiceNotification(null); }} style={{ padding: '7px 10px', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)', color: '#a7f3d0', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Buka</button>
                <button type="button" aria-label="Tutup notifikasi" onClick={() => setServiceNotification(null)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: 0, background: 'transparent', color: '#a7f3d0', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            )}

            {/* KOTAK INPUT NAMA GURU BK MANUAL */}
            <div className="bk-counselor-card" style={{ backgroundColor: 'rgba(2, 31, 24, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px 24px', marginBottom: '18px', border: '1.5px solid rgba(52, 211, 153, 0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <div className="bk-counselor-profile">
                <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <UserCheck size={22} color="#34d399" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ marginBottom: '3px', fontSize: '10px', color: '#6ee7b7', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Konselor Aktif</div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '800' }}>{namaGuruBK}</h3>
                </div>
              </div>

              <div className="bk-counselor-preset">
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  aria-label="Nama Guru BK aktif"
                  placeholder="Nama Guru BK aktif"
                  style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '9px', border: '1px solid rgba(52, 211, 153, 0.4)', backgroundColor: '#021f18', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleSimpanNamaManual}
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '9px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', whiteSpace: 'nowrap' }}
                >
                  Simpan Nama
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="bk-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px', width: '100%', boxSizing: 'border-box' }}>
              <div className="bk-summary-card" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', padding: '17px', borderRadius: '16px', borderTop: '3px solid #6ee7b7', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8fd8b6', fontSize: '11px', fontWeight: 800 }}><MessageSquareText size={15} /> PESAN CURHAT</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ecfdf5', marginTop: '8px' }}>{dataCurhat.length}</div>
              </div>
              <div className="bk-summary-card" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', padding: '17px', borderRadius: '16px', borderTop: '3px solid #34d399', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8fd8b6', fontSize: '11px', fontWeight: 800 }}><Calendar size={15} /> JADWAL KONSELING</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ecfdf5', marginTop: '8px' }}>{dataKonseling.length}</div>
              </div>
              <div className="bk-summary-card" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', padding: '17px', borderRadius: '16px', borderTop: '3px solid #f87171', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8fd8b6', fontSize: '11px', fontWeight: 800 }}><AlertTriangle size={15} /> PELANGGARAN OSIS</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ecfdf5', marginTop: '8px' }}>{dataPelanggaran.length}</div>
              </div>
              <div className="bk-summary-card" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', padding: '17px', borderRadius: '16px', borderTop: '3px solid #fbbf24', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8fd8b6', fontSize: '11px', fontWeight: 800 }}><UserCheck size={15} /> PERLU TINDAK LANJUT</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fde68a', marginTop: '8px' }}>{followUpCount}</div>
              </div>
            </div>

            {/* PELANGGARAN MASUK DARI OSIS */}
            <div className="bk-dashboard-overview">
            <section className="bk-dashboard-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#f87171" />
                    Pelanggaran Masuk dari OSIS
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Catatan pelanggaran terbaru yang diinput oleh pengurus OSIS di gerbang</p>
                </div>
                <Link href="/bk/pelanggaran" style={{ textDecoration: 'none', color: '#34d399', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Lihat Semua</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {filteredPelanggaran.length === 0 ? (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{dataPelanggaran.length > 0 ? 'Tidak ada catatan pelanggaran yang cocok dengan pencarian.' : 'Belum ada pelanggaran yang masuk dari OSIS.'}</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {filteredPelanggaran.slice(0, 5).map((item) => (
                    <div key={item.id || `${item.nama_siswa}-${item.created_at}`} style={{ border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '12px', padding: '14px', backgroundColor: '#021f18', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{item.nama_siswa || 'Siswa'}</strong>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.kelas || '-'} • <span style={{ color: '#fca5a5' }}>{item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</span></div>
                        </div>
                        <span style={{ backgroundColor: '#451a03', color: '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(248, 113, 113, 0.3)' }}>+{item.poin ?? 0} Poin</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        📅 {item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-')} • Petugas: {item.pencatat || 'OSIS'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="bk-dashboard-panel">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '700' }}>Statistik Kategori</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Jenis pelanggaran yang tercatat</p>
              </div>
              {categoryStats.length === 0 ? (
                <p style={{ margin: '18px 0 0', color: '#94a3b8', fontSize: '13px' }}>Belum ada data kategori untuk diringkas.</p>
              ) : (
                <div className="bk-category-stat">
                  {categoryStats.map(([category, count]) => (
                    <div className="bk-category-stat-row" key={category}>
                      <span>{category}</span>
                      <strong>{count}</strong>
                      <div className="bk-category-stat-track" aria-label={`${count} catatan`}>
                        <span style={{ width: `${(count / maxCategoryCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </div>

            {/* TAB INTERNAL */}
            <div ref={permohonanKonselingRef} style={{ display: 'flex', gap: '10px', marginBottom: '16px', width: '100%', boxSizing: 'border-box', scrollMarginTop: '20px' }}>
              <button
                onClick={() => setTabAktif('curhat')}
                style={{ 
                  flex: 1,
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  backgroundColor: tabAktif === 'curhat' ? '#059669' : 'rgba(2, 31, 24, 0.85)', 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  border: tabAktif === 'curhat' ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)' 
                }}
              >
                📩 Pesan Curhat Siswa {urgentCurhatCount > 0 && <span style={{ marginLeft: '5px', color: '#fecaca' }}>({urgentCurhatCount} prioritas)</span>}
              </button>
              <button
                onClick={() => setTabAktif('konseling')}
                style={{ 
                  flex: 1,
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  backgroundColor: tabAktif === 'konseling' ? '#059669' : 'rgba(2, 31, 24, 0.85)', 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  border: tabAktif === 'konseling' ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)' 
                }}
              >
                📅 Permohonan Konseling {dataKonseling.length > 0 && <span style={{ marginLeft: '5px', color: '#a7f3d0' }}>({dataKonseling.length})</span>}
              </button>
            </div>

            {/* TABEL DATA */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              {tabAktif === 'curhat' ? (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#f8fafc', minWidth: '450px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#011611', color: '#a7f3d0', borderBottom: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <th style={{ padding: '14px' }}>Pengirim / Kelas</th>
                        <th style={{ padding: '14px' }}>Judul Pesan</th>
                        <th style={{ padding: '14px' }}>Tanggal</th>
                        <th style={{ padding: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurhat.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>{dataCurhat.length > 0 ? 'Tidak ada curhat yang cocok dengan pencarian.' : 'Belum ada curhatan masuk.'}</td></tr>
                      ) : (
                        filteredCurhat.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '14px', fontWeight: '700' }}>🔒 {item.nama_siswa || 'Anonim'}</td>
                            <td style={{ padding: '14px' }}>
                              {isHighPriorityMessage(item.judul_pesan, item.pesan, item.topik, item.deskripsi) && <span style={{ display: 'inline-flex', marginRight: '7px', padding: '3px 7px', borderRadius: '5px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(127, 29, 29, 0.35)', color: '#fecaca', fontSize: '10px', fontWeight: 800 }}>SEGERA</span>}
                              {item.judul_pesan || item.topik}
                            </td>
                            <td style={{ padding: '14px', color: '#94a3b8' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#fcd34d', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid rgba(252, 211, 77, 0.3)' }}>{item.status || 'TERKIRIM'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#f8fafc', minWidth: '450px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#011611', color: '#a7f3d0', borderBottom: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <th style={{ padding: '14px' }}>Siswa</th>
                        <th style={{ padding: '14px' }}>Jadwal</th>
                        <th style={{ padding: '14px' }}>Topik</th>
                        <th style={{ padding: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKonseling.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>{dataKonseling.length > 0 ? 'Tidak ada permohonan yang cocok dengan pencarian.' : 'Belum ada permohonan konseling.'}</td></tr>
                      ) : (
                        filteredKonseling.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '14px', fontWeight: '700' }}>{item.nama_siswa} ({item.kelas})</td>
                            <td style={{ padding: '14px', color: '#94a3b8' }}>{item.tanggal}</td>
                            <td style={{ padding: '14px' }}>
                              {isHighPriorityMessage(item.judul_pesan, item.pesan, item.topik, item.deskripsi) && <span style={{ display: 'inline-flex', marginRight: '7px', padding: '3px 7px', borderRadius: '5px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(127, 29, 29, 0.35)', color: '#fecaca', fontSize: '10px', fontWeight: 800 }}>SEGERA</span>}
                              {item.topik || item.judul_pesan}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ backgroundColor: 'rgba(5, 150, 105, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>{item.status || 'TERJADWAL'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>

      {/* POP-UP KONSELING PRIORITAS (Disamakan dengan desain pop-up Curhat Prioritas) */}
      {isUrgentCounselingPopupOpen && urgentCounselingCount > 0 && (
        <div
          className="bk-priority-overlay"
          onClick={dismissUrgentCounselingPopup}
        >
          <section
            className="bk-priority-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="urgent-counseling-title"
            aria-describedby="urgent-counseling-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bk-priority-dialog-topline">
              <span><AlertTriangle size={14} /> PERHATIAN GURU BK</span>
              <button type="button" aria-label="Tutup notifikasi" onClick={dismissUrgentCounselingPopup}>
                <X size={18} />
              </button>
            </div>

            <div className="bk-priority-mindy-message">
              <span className="bk-priority-mindy-avatar" aria-hidden="true">
                <i />
                <i />
                <b />
              </span>
              <div>
                <span className="bk-priority-mindy-name">Mindy mengingatkan</span>
                <p id="urgent-counseling-title">SEGERA TANGANI SISWA INI!</p>
              </div>
            </div>

            <div className="bk-priority-dialog-copy">
              <h2>Konseling prioritas perlu ditindaklanjuti</h2>
              <p id="urgent-counseling-description">
                Ada {urgentCounselingCount} permohonan konseling prioritas yang belum ditangani. Mohon segera tinjau dan jadwalkan pendampingan bagi siswa.
              </p>
            </div>

            <div className="bk-priority-student-list">
              {urgentCounselingItems.slice(0, 4).map((item, index) => (
                <div className="bk-priority-student" key={String(item.id ?? `${item.created_at}-${index}`)}>
                  <span className="bk-priority-student-icon"><AlertTriangle size={15} /></span>
                  <span>
                    <strong>{item.nama_siswa || 'Siswa'}{item.kelas ? ` · ${item.kelas}` : ''}</strong>
                    <small>{item.judul_pesan || item.topik || 'Permohonan konseling prioritas'}</small>
                  </span>
                  <span className="bk-priority-badge">PRIORITAS</span>
                </div>
              ))}
              {urgentCounselingCount > 4 && (
                <span className="bk-priority-more">Dan {urgentCounselingCount - 4} permohonan prioritas lainnya.</span>
              )}
            </div>

            <div className="bk-priority-dialog-actions">
              <button type="button" className="bk-priority-later" onClick={dismissUrgentCounselingPopup}>Nanti</button>
              <button type="button" className="bk-priority-review" onClick={bukaPermohonanKonseling}>
                Tinjau konseling <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* POP-UP CURHAT PRIORITAS */}
      {isUrgentCurhatPopupOpen && urgentCurhatCount > 0 && (
        <div
          className="bk-priority-overlay"
          onClick={dismissUrgentCurhatPopup}
        >
          <section
            className="bk-priority-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="urgent-curhat-title"
            aria-describedby="urgent-curhat-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bk-priority-dialog-topline">
              <span><AlertTriangle size={14} /> PERHATIAN GURU BK</span>
              <button type="button" aria-label="Tutup notifikasi" onClick={dismissUrgentCurhatPopup}>
                <X size={18} />
              </button>
            </div>

            <div className="bk-priority-mindy-message">
              <span className="bk-priority-mindy-avatar" aria-hidden="true">
                <i />
                <i />
                <b />
              </span>
              <div>
                <span className="bk-priority-mindy-name">Mindy mengingatkan</span>
                <p id="urgent-curhat-title">SEGERA TANGANI SISWA INI!</p>
              </div>
            </div>

            <div className="bk-priority-dialog-copy">
              <h2>Curhat prioritas perlu ditindaklanjuti</h2>
              <p id="urgent-curhat-description">
                Ada {urgentCurhatCount} curhat prioritas yang belum ditangani. Mohon tinjau dengan empati dan jaga kerahasiaan siswa.
              </p>
            </div>

            <div className="bk-priority-student-list">
              {urgentCurhatItems.slice(0, 4).map((item, index) => (
                <div className="bk-priority-student" key={String(item.id ?? `${item.created_at}-${index}`)}>
                  <span className="bk-priority-student-icon"><AlertTriangle size={15} /></span>
                  <span>
                    <strong>{item.nama_siswa || 'Siswa'}{item.kelas ? ` · ${item.kelas}` : ''}</strong>
                    <small>{item.judul_pesan || item.topik || 'Curhat prioritas'}</small>
                  </span>
                  <span className="bk-priority-badge">PRIORITAS</span>
                </div>
              ))}
              {urgentCurhatCount > 4 && (
                <span className="bk-priority-more">Dan {urgentCurhatCount - 4} curhat prioritas lainnya.</span>
              )}
            </div>

            <div className="bk-priority-dialog-actions">
              <button type="button" className="bk-priority-later" onClick={dismissUrgentCurhatPopup}>Nanti</button>
              <button type="button" className="bk-priority-review" onClick={bukaCurhatPrioritas}>
                Tinjau curhat <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}