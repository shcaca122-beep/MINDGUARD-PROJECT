'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { isHighPriorityMessage, markPriorityTitle } from '@/lib/counseling-priority';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Lightbulb,
  Loader2,
  Lock,
  MessageSquareHeart,
  PenTool,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import styles from './curhat.module.css';

type CurhatHistoryRecord = {
  id: string | number;
  nama_siswa?: string | null;
  judul_pesan?: string | null;
  topik?: string | null;
  deskripsi?: string | null;
  pesan?: string | null;
  status?: string | null;
  balasan?: string | null;
  created_at?: string | null;
};

const formatCurhatDate = (dateValue?: string | null) => {
  if (!dateValue) return 'Tanggal tidak tersedia';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

function isDuplicateCurhatError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string };
  const combined = `${err.message || ''} ${err.details || ''}`.toLowerCase();

  return (
    err.code === '23505' ||
    combined.includes('duplicate') ||
    combined.includes('duplikat') ||
    combined.includes('unique') ||
    combined.includes('sudah ada') ||
    combined.includes('sudah tercatat') ||
    combined.includes('sudah dikirim')
  );
}

export default function CurhatPage() {
  const [kategori, setKategori] = useState('Pribadi / Emosional');
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [isAnonim, setIsAnonim] = useState(true);
  const [needsFastSupport, setNeedsFastSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [studentName, setStudentName] = useState('Siswa');
  const [curhatHistory, setCurhatHistory] = useState<CurhatHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Gagal memeriksa sesi akun: ${userError.message}`);
      if (!user?.email) throw new Error('Sesi login tidak valid. Silakan masuk kembali.');

      const { data, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('email_siswa', user.email)
        .eq('layanan', 'CURHAT')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(`Gagal memuat riwayat curhat: ${error.message}`);
      setCurhatHistory((data || []) as CurhatHistoryRecord[]);
    } catch (error) {
      console.error('Gagal memuat riwayat curhat siswa:', error);
      setHistoryError(error instanceof Error ? error.message : 'Riwayat curhat belum dapat dimuat.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const sessionValue = localStorage.getItem('user_session');
        if (sessionValue) {
          const session: unknown = JSON.parse(sessionValue);
          if (session && typeof session === 'object' && 'nama' in session && typeof session.nama === 'string') {
            setStudentName(session.nama);
          }
        }
      } catch (error) {
        console.error('Gagal membaca nama siswa dari sesi:', error);
      }
      void loadHistory();
    });
    return () => {
      isMounted = false;
    };
  }, [loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const cleanJudul = judul.trim();
    const cleanPesan = pesan.trim();

    if (!cleanJudul || !cleanPesan) {
      setStatus({
        type: 'warning',
        message: 'Judul dan isi curhatan tidak boleh kosong atau hanya berisi spasi.',
      });
      return;
    }

    // Cek duplikasi cepat terhadap riwayat curhat yang sudah tercatat
    const normalizedTitle = `[${kategori}] ${cleanJudul}`.toLowerCase();
    const isAlreadySent = curhatHistory.some((item) => {
      const existingTitle = (item.judul_pesan || '').replace(/^\[PRIORITAS\]\s*/i, '').trim().toLowerCase();
      const existingBody = (item.topik || item.deskripsi || item.pesan || '').trim().toLowerCase();
      return existingTitle === normalizedTitle && existingBody === cleanPesan.toLowerCase();
    });

    if (isAlreadySent) {
      setStatus({
        type: 'warning',
        message:
          'Curhatan dengan judul dan isi yang sama sudah tercatat di riwayatmu. Sistem mencegah pengiriman ganda agar pesanmu tidak menumpuk di panel Guru BK.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = localStorage.getItem('user_session');
      const session = sessionData ? JSON.parse(sessionData) : {};
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) throw new Error('Sesi login tidak valid. Silakan masuk kembali.');

      const namaPengirim = isAnonim ? 'Anonim' : (session.nama || session.email || 'Siswa');
      const isPriority = needsFastSupport || isHighPriorityMessage(cleanJudul, cleanPesan);
      const messageTitle = `[${kategori}] ${cleanJudul}`;

      const payload: Record<string, string> = {
        nama_siswa: namaPengirim,
        email_siswa: user.email,
        layanan: 'CURHAT',
        judul_pesan: isPriority ? markPriorityTitle(messageTitle) : messageTitle,
        deskripsi: cleanPesan,
        topik: cleanPesan,
        status: 'TERKIRIM',
      };

      if (session.kelas) {
        payload.kelas = session.kelas;
      }

      let { error } = await supabase.from('layanan_siswa').insert([payload]);

      if (error && !isDuplicateCurhatError(error) && error.message?.includes('topik')) {
        delete payload.topik;
        const retry = await supabase.from('layanan_siswa').insert([payload]);
        error = retry.error;
      }

      if (error && !isDuplicateCurhatError(error) && error.message?.includes('deskripsi')) {
        delete payload.deskripsi;
        payload.judul_pesan = `[${kategori}] ${cleanJudul}: ${cleanPesan}`;
        const retry2 = await supabase.from('layanan_siswa').insert([payload]);
        error = retry2.error;
      }

      if (error) {
        if (isDuplicateCurhatError(error)) {
          setStatus({
            type: 'warning',
            message:
              'Curhatan serupa sudah tercatat sebelumnya di sistem. Untuk menghindari duplikasi data, kamu tidak perlu mengirimkannya dua kali—silakan cek daftar Riwayat Curhat Terkirim di samping.',
          });
          return;
        }
        throw new Error(error.message);
      }

      setStatus({
        type: 'success',
        message: isPriority
          ? 'Pesanmu sudah dikirim dan ditandai prioritas untuk Guru BK. Jika kamu dalam bahaya sekarang, segera temui Guru BK atau orang dewasa tepercaya; jangan menunggu balasan aplikasi.'
          : 'Curhatanmu berhasil terkirim secara aman & rahasia ke Guru BK!',
      });
      setJudul('');
      setPesan('');
      setNeedsFastSupport(false);
      void loadHistory();
    } catch (err: unknown) {
      console.error('Error submit:', err);
      if (isDuplicateCurhatError(err)) {
        setStatus({
          type: 'warning',
          message:
            'Curhatan serupa sudah tercatat sebelumnya di sistem. Sistem mencegah penyimpanan ganda agar riwayatmu tetap rapi.',
        });
      } else {
        setStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Gagal mengirim curhatan.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const messageNeedsReview = isHighPriorityMessage(judul, pesan);
  const repliedCount = curhatHistory.filter((item) => Boolean(item.balasan?.trim())).length;
  const waitingCount = curhatHistory.length - repliedCount;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      <div className="student-panel-page student-feature-refresh student-curhat-page" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div className="student-feature-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <div className={styles.topbar}>
            <div className={styles.topbarTitle}>
              <span className={styles.topbarIcon}><MessageSquareHeart size={18} /></span>
              <strong>Curhat ke Guru BK</strong>
              <code>/curhat</code>
            </div>
            <div className={styles.welcome}>
              <Sparkles size={14} />
              <span>Selamat Datang, <strong>{studentName.toLocaleUpperCase('id-ID')}!</strong></span>
            </div>
          </div>

          <div className="student-feature-content student-curhat-content" style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <header className={styles.pageHeading}>
              <span className={styles.pageHeadingIcon}><MessageSquareHeart size={22} /></span>
              <div>
                <h1>Layanan Curhat Anonim</h1>
                <p>Ruang aman untuk bercerita tanpa rasa khawatir atau dihakimi.</p>
              </div>
            </header>

            <div
              style={{
                backgroundColor: 'rgba(2, 31, 24, 0.85)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '25px',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ecfdf5' }}>Ruang Curhat Safe Space</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0' }}>
                Luapkan apa yang kamu rasakan tanpa perlu khawatir. Kamu bisa memilih untuk mengirim pesan secara Anonim (Tanpa Nama).
              </p>
            </div>

            {status && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  lineHeight: 1.55,
                  backgroundColor:
                    status.type === 'success'
                      ? '#064e3b'
                      : status.type === 'warning'
                      ? 'rgba(120, 53, 15, 0.85)'
                      : '#7f1d1d',
                  color:
                    status.type === 'success'
                      ? '#dcfce7'
                      : status.type === 'warning'
                      ? '#fef3c7'
                      : '#fee2e2',
                  border: `1px solid ${
                    status.type === 'success'
                      ? '#10b981'
                      : status.type === 'warning'
                      ? '#fbbf24'
                      : '#f87171'
                  }`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  {status.type === 'warning' && (
                    <strong style={{ display: 'block', color: '#fde68a', marginBottom: '2px' }}>
                      ⚠️ Duplikasi Pesan Dicegah
                    </strong>
                  )}
                  <span style={{ fontWeight: status.type === 'warning' ? 500 : 700 }}>
                    {status.type === 'success' ? '✅ ' : status.type === 'error' ? '❌ ' : ''}
                    {status.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(null)}
                  aria-label="Tutup pemberitahuan"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '2px',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* FORM GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
              
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PenTool size={18} color="#34d399" />
                  Tulis Curhatanmu
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Kategori Cerita
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="Pribadi / Emosional">Pribadi / Kecemasan / Emosional</option>
                      <option value="Masalah Teman / Bullying">Masalah Peretemanan / Bullying</option>
                      <option value="Kendala Keluarga">Masalah Keluarga / Rumah</option>
                      <option value="Kesulitan Belajar">Kesulitan Belajar / Akademik</option>
                      <option value="Lainnya">Lain-Lain</option>
                    </select>
                  </div>

                  {(messageNeedsReview || needsFastSupport) && (
                    <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.45)', background: 'rgba(127, 29, 29, 0.28)', color: '#fecaca', fontSize: '12px', lineHeight: 1.5 }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>Pesan ini akan ditandai prioritas untuk ditinjau Guru BK. Ini bukan layanan darurat.</span>
                    </div>
                  )}
                  {(messageNeedsReview || needsFastSupport) && isAnonim && (
                    <p style={{ margin: '-8px 0 0', color: '#fecaca', fontSize: '11px', lineHeight: 1.5 }}>
                      Nama pesan akan disamarkan, tetapi akunmu tetap tertaut dan email akun dapat digunakan Guru BK untuk menghubungimu.
                    </p>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Judul / Perihal
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Merasa tertekan dengan tugas / Konflik sama teman"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="curhat-message" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      <span>Isi Cerita / Curhatan</span>
                      <span className={styles.characterCount}>{pesan.length} karakter</span>
                    </label>
                    <textarea
                      id="curhat-message"
                      rows={6}
                      required
                      placeholder="Tuliskan semua yang ingin kamu luapkan secara bebas di sini..."
                      value={pesan}
                      onChange={(e) => setPesan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '5px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.35)', background: 'rgba(127, 29, 29, 0.16)' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', color: '#fee2e2', fontSize: '12px', fontWeight: 700, cursor: 'pointer', lineHeight: 1.5 }}>
                      <input type="checkbox" checked={needsFastSupport} onChange={(event) => setNeedsFastSupport(event.target.checked)} style={{ marginTop: '2px', accentColor: '#f87171' }} />
                      <span>Saya membutuhkan bantuan Guru BK secepatnya</span>
                    </label>
                    <p style={{ margin: '0 0 0 25px', color: '#fecaca', fontSize: '11px', lineHeight: 1.5 }}>
                      Jika ada bahaya saat ini, segera temui Guru BK atau orang dewasa tepercaya. Jangan menunggu balasan aplikasi.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#021f18', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: '700', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAnonim}
                        onChange={(e) => setIsAnonim(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <Lock size={14} color="#34d399" />
                      Kirim sebagai Anonim (Sembunyikan Namaku)
                    </label>
                    <p style={{ margin: '4px 0 0 26px', fontSize: '11px', color: '#94a3b8' }}>
                      {isAnonim
                        ? 'Nama pesan ditampilkan sebagai Anonim; email akun tetap tertaut dan dapat diakses Guru BK.'
                        : 'Nama dan kelasmu akan terlihat oleh Guru BK; email akun tetap tertaut.'}
                    </p>
                  </div>

                  {/* PERINGATAN RAMAH DUPLIKASI DI ATAS TOMBOL KIRIM */}
                  {status?.type === 'warning' && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(251, 191, 36, 0.45)',
                        backgroundColor: 'rgba(120, 53, 15, 0.35)',
                        color: '#fef3c7',
                        fontSize: '12px',
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️ {status.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isLoading ? 'Mengirim Rahasia...' : 'Kirim Curhatan Sekarang'}</span>
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Lock size={18} color="#fcd34d" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Ruang Aman (Safe Space)</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    MindGuard dirancang khusus agar kamu bisa meluapkan isi hati tanpa rasa takut dihakimi. Curhatanmu akan dibaca secara cermat oleh Guru BK.
                  </p>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Lightbulb size={18} color="#fcd34d" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Tips Menulis Curhatan</h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                    <li>Tuliskan apa adanya yang sedang kamu rasakan.</li>
                    <li>Sebutkan situasi yang membuatmu merasa tidak nyaman.</li>
                    <li>Jika butuh bantuan tatap muka, gunakan fitur <Link href="/booking" className={styles.inlineLink}>Booking BK</Link>.</li>
                  </ul>
                </div>

                <section className={styles.historyCard} aria-labelledby="curhat-history-title">
                  <div className={styles.historyHeader}>
                    <div>
                      <h3 id="curhat-history-title">Riwayat Curhat Terkirim</h3>
                      <p>Pesan terbaru yang dikirim dari akunmu.</p>
                    </div>
                    <span className={styles.historyCount}>{curhatHistory.length} pesan</span>
                  </div>

                  {/* RINGKASAN AGREGAT DINAMIS & RESPONSIF */}
                  {!historyLoading && !historyError && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '8px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(8, 24, 16, 0.75)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#a7f3d0' }}>Total Curhat</span>
                        <strong style={{ fontSize: '15px', color: '#34d399', fontFamily: 'monospace' }}>{curhatHistory.length}</strong>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(8, 24, 16, 0.75)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#fde68a' }}>Menunggu</span>
                        <strong style={{ fontSize: '15px', color: '#fbbf24', fontFamily: 'monospace' }}>{waitingCount}</strong>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(8, 24, 16, 0.75)', border: '1px solid rgba(96, 165, 250, 0.25)' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#bfdbfe' }}>Sudah Dibalas</span>
                        <strong style={{ fontSize: '15px', color: '#60a5fa', fontFamily: 'monospace' }}>{repliedCount}</strong>
                      </div>
                    </div>
                  )}

                  {historyLoading ? (
                    <div className={styles.historyState} role="status">
                      <Loader2 size={17} className="animate-spin" /> Memuat riwayat...
                    </div>
                  ) : historyError ? (
                    <div className={`${styles.historyState} ${styles.historyError}`} role="alert">
                      <span>{historyError}</span>
                      <button type="button" onClick={() => void loadHistory()} aria-label="Muat ulang riwayat curhat">
                        <RefreshCw size={15} /> Coba lagi
                      </button>
                    </div>
                  ) : curhatHistory.length === 0 ? (
                    <div className={styles.historyEmpty}>
                      <span className={styles.historyEmptyIcon}><MessageSquareHeart size={18} /></span>
                      <strong>Belum ada curhatan terkirim</strong>
                      <span>Pesan yang kamu kirim akan tampil di sini.</span>
                    </div>
                  ) : (
                    <div className={styles.historyList}>
                      {curhatHistory.map((item) => {
                        const hasReply = Boolean(item.balasan?.trim());
                        const messageBody = item.topik || item.deskripsi || item.pesan;
                        const displayStatus = hasReply
                          ? 'Sudah dibalas'
                          : item.status?.toLocaleUpperCase('id-ID') === 'TERKIRIM'
                            ? 'Menunggu balasan'
                            : item.status || 'Terkirim';
                        return (
                          <article className={styles.historyItem} key={item.id}>
                            <div className={styles.historyItemTop}>
                              <span className={styles.anonymousBadge}>
                                {item.nama_siswa === 'Anonim' ? <Lock size={10} /> : <UserRound size={10} />}
                                {item.nama_siswa === 'Anonim' ? 'Anonim' : item.nama_siswa || 'Pengirim'}
                              </span>
                              <span className={styles.historyDate}><CalendarDays size={12} />{formatCurhatDate(item.created_at)}</span>
                            </div>
                            <h4>{item.judul_pesan || 'Curhat tanpa judul'}</h4>
                            <p className={styles.historyMessage}>{messageBody || 'Isi pesan belum tersedia.'}</p>
                            <div className={`${styles.historyStatus} ${hasReply ? styles.historyStatusReplied : ''}`}>
                              <span>{displayStatus}</span>
                              {!hasReply && <Clock3 size={12} />}
                            </div>
                            {hasReply && (
                              <div className={styles.replyBox}>
                                <strong>Balasan Guru BK:</strong>
                                <p>{item.balasan}</p>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}