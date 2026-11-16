'use client';

import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  HeartHandshake,
  MessageSquareHeart,
  Quote,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Sesuaikan dengan path client Supabase di proyekmu (misal '@/utils/supabase/client')
import styles from './dashboard.module.css';

const affirmations = [
  'Perasaanmu valid. Kamu berhak mendapatkan ruang aman untuk didengarkan.',
  'Kamu tidak harus menyelesaikan semuanya hari ini. Satu langkah kecil sudah berarti.',
  'Meminta bantuan adalah bentuk keberanian, bukan kelemahan.',
  'Kamu pantas bertumbuh dengan tenang, sesuai waktumu sendiri.',
];

const services = [
  {
    href: '/booking',
    title: 'Booking BK',
    description: 'Pilih guru BK dan tentukan jadwal konseling tatap muka secara privat.',
    action: 'Atur jadwal',
    Icon: CalendarDays,
    tone: 'blue',
  },
  {
    href: '/curhat',
    title: 'Curhat Anonim',
    description: 'Bagikan ceritamu tanpa khawatir. Identitasmu aman dan terlindungi.',
    action: 'Mulai bercerita',
    Icon: MessageSquareHeart,
    tone: 'mint',
  },
  {
    href: '/jurnal',
    title: 'Jurnal Pribadi',
    description: 'Tulis perasaanmu dan simpan sebagai catatan refleksi harian.',
    action: 'Tulis refleksi',
    Icon: BookOpen,
    tone: 'violet',
  },
  {
    href: '/pelanggaran-saya',
    title: 'Poin & Pelanggaran Saya',
    description: 'Lihat jumlah poin dan rincian catatan pelanggaranmu secara transparan.',
    action: 'Cek rincian',
    Icon: ShieldAlert,
    tone: 'amber',
  },
];

type BreathingPhase = 'Tarik napas' | 'Tahan' | 'Hembuskan';

interface UserSession {
  id?: string;
  user_id?: string;
  nisn?: string;
  nama?: string;
  role?: string;
  isAdmin?: boolean;
}

interface StudentAgregat {
  totalCurhat: number;
  curhatPrioritas: number;
  totalBooking: number;
  totalJurnal: number;
  totalPoin: number;
}

function getBreathingPhase(secondsLeft: number): BreathingPhase {
  const elapsed = (60 - secondsLeft) % 12;
  if (elapsed < 4) return 'Tarik napas';
  if (elapsed < 6) return 'Tahan';
  return 'Hembuskan';
}

/**
 * Helper penerjemah error duplikasi database menjadi pesan ramah
 */
function toFriendlyDuplicateMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as { code?: string; message?: string };
  const msg = (err.message || '').toLowerCase();

  if (
    err.code === '23505' ||
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    msg.includes('sudah ada') ||
    msg.includes('sudah tercatat')
  ) {
    return 'Data yang sama sudah pernah kamu kirim sebelumnya. Sistem mencegah penyimpanan ganda agar riwayatmu tetap rapi.';
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userNama, setUserNama] = useState('Siswa');
  const [studentIdentifier, setStudentIdentifier] = useState<string>('');
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(60);
  const [breathingComplete, setBreathingComplete] = useState(false);

  // State untuk hasil kueri agregat & peringatan ramah duplikasi
  const [agregat, setAgregat] = useState<StudentAgregat>({
    totalCurhat: 0,
    curhatPrioritas: 0,
    totalBooking: 0,
    totalJurnal: 0,
    totalPoin: 0,
  });
  const [isLoadingAgregat, setIsLoadingAgregat] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Fungsi mengambil hasil kueri agregat siswa secara dinamis
  const loadStudentAgregat = useCallback(async (identifier: string) => {
    if (!identifier) {
      setIsLoadingAgregat(false);
      return;
    }

    setIsLoadingAgregat(true);
    try {
      // 1. Cek hasil view agregat dari tahap sebelumnya (sesuaikan nama view/tabel jika berbeda)
      const { data: viewData, error: viewError } = await supabase
        .from('curhat_aggregation')
        .select('*')
        .eq('user_id', identifier)
        .maybeSingle();

      // 2. Hitung agregat langsung dari tabel layanan siswa sebagai sinkronisasi utama/fallback
      const [curhatRes, bookingRes, jurnalRes, poinRes] = await Promise.all([
        supabase
          .from('curhat')
          .select('id, is_urgent, kategori', { count: 'exact' })
          .or(`user_id.eq.${identifier},nisn.eq.${identifier}`),
        supabase
          .from('booking_konseling')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${identifier},nisn.eq.${identifier}`),
        supabase
          .from('jurnal_pribadi')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${identifier},nisn.eq.${identifier}`),
        supabase
          .from('pelanggaran_siswa')
          .select('poin')
          .or(`siswa_id.eq.${identifier},nisn.eq.${identifier}`),
      ]);

      // Deteksi jika terjadi error duplikasi saat sinkronisasi
      const dupMsg =
        toFriendlyDuplicateMessage(viewError) ||
        toFriendlyDuplicateMessage(curhatRes.error) ||
        toFriendlyDuplicateMessage(bookingRes.error);
      if (dupMsg) {
        setDuplicateWarning(dupMsg);
      }

      const curhatList = curhatRes.data ?? [];
      const totalCurhat =
        viewData?.total_curhat ?? curhatRes.count ?? curhatList.length;
      const curhatPrioritas =
        viewData?.total_prioritas ??
        curhatList.filter((item) => Boolean(item.is_urgent)).length;

      const totalPoin = (poinRes.data ?? []).reduce(
        (acc, row) => acc + (Number(row.poin) || 0),
        0
      );

      setAgregat({
        totalCurhat,
        curhatPrioritas,
        totalBooking: bookingRes.count ?? 0,
        totalJurnal: jurnalRes.count ?? 0,
        totalPoin,
      });
    } catch (err) {
      const dupMsg = toFriendlyDuplicateMessage(err);
      if (dupMsg) setDuplicateWarning(dupMsg);
      console.error('Gagal memuat data agregat siswa:', err);
    } finally {
      setIsLoadingAgregat(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const sessionData = localStorage.getItem('user_session');
        if (!sessionData) {
          router.replace('/');
          return;
        }

        const session = JSON.parse(sessionData) as UserSession;
        const role = (session.role || '').toUpperCase();

        if (session.nama) setUserNama(session.nama);

        if (
          session.isAdmin === true ||
          role.includes('ADMIN') ||
          role === 'TU' ||
          role.includes('TATA USAHA')
        ) {
          router.replace('/admin1');
          return;
        } else if (role.includes('OSIS') || role.includes('MPK')) {
          router.replace('/osis');
          return;
        } else if (role.includes('PIKET')) {
          router.replace('/piket');
          return;
        } else if (role.includes('BK')) {
          router.replace('/bk');
          return;
        }

        const identifier = session.user_id || session.id || session.nisn || '';
        setStudentIdentifier(identifier);
        loadStudentAgregat(identifier);

        // Tangkap peringatan duplikasi jika diarahkan dari halaman form (?warning=duplicate)
        const params = new URLSearchParams(window.location.search);
        if (params.get('warning') === 'duplicate') {
          setDuplicateWarning(
            'Pengajuan serupa sudah tercatat di sistem. Kamu tidak perlu mengirimkannya dua kali.'
          );
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        router.replace('/');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router, loadStudentAgregat]);

  useEffect(() => {
    if (!isBreathing) return;

    const intervalId = window.setInterval(() => {
      setBreathingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const timeoutId = window.setTimeout(() => {
      setIsBreathing(false);
      setBreathingComplete(true);
      setBreathingSeconds(0);
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isBreathing]);

  const handleNextAffirmation = () => {
    setAffirmationIndex((index) => (index + 1) % affirmations.length);
    setCopyStatus('');
  };

  const handleCopyAffirmation = async () => {
    try {
      await navigator.clipboard.writeText(affirmations[affirmationIndex]);
      setCopyStatus('Kutipan tersalin');
    } catch (error) {
      console.error('Gagal menyalin afirmasi:', error);
      setCopyStatus('Tidak dapat menyalin kutipan');
    }
  };

  const handleOpenBreathing = () => {
    setBreathingSeconds(60);
    setBreathingComplete(false);
    setIsBreathing(false);
    setIsBreathingOpen(true);
  };

  const handleCloseBreathing = () => {
    setIsBreathingOpen(false);
    setIsBreathing(false);
    setBreathingSeconds(60);
    setBreathingComplete(false);
  };

  const handleStartBreathing = () => {
    setBreathingSeconds(60);
    setBreathingComplete(false);
    setIsBreathing(true);
  };

  const agregatCards = [
    {
      label: 'Total Curhat Terkirim',
      value: agregat.totalCurhat,
      sub:
        agregat.curhatPrioritas > 0
          ? `${agregat.curhatPrioritas} ditandai prioritas`
          : 'Semua curhat terjaga aman',
      accent: '#52B788',
    },
    {
      label: 'Sesi Konseling BK',
      value: agregat.totalBooking,
      sub: 'Total reservasi jadwal bimbingan',
      accent: '#60A5FA',
    },
    {
      label: 'Catatan Jurnal Harian',
      value: agregat.totalJurnal,
      sub: 'Refleksi perasaan tersimpan',
      accent: '#C084FC',
    },
    {
      label: 'Akumulasi Poin Disiplin',
      value: `${agregat.totalPoin} Poin`,
      sub: agregat.totalPoin === 0 ? 'Catatan kedisiplinan bersih' : 'Pantau di menu rincian',
      accent: agregat.totalPoin >= 25 ? '#FBBF24' : '#34D399',
    },
  ];

  return (
    <div className={`student-panel-page student-feature-refresh student-dashboard-page ${styles.page}`}>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>

      <div className={`student-feature-scroll ${styles.contentColumn}`}>
        <header className={styles.topbar}>
          <div className={styles.pageTitle}>
            <span className={styles.pageIcon}><ShieldCheck size={18} /></span>
            <h1>Dashboard Ruang Tenang</h1>
            <code>/dashboard</code>
          </div>
          <div className={styles.welcomePill}>
            <Sparkles size={15} />
            <span>Selamat datang, <strong>{userNama}</strong></span>
          </div>
        </header>

        <main className={`student-feature-content student-dashboard-content ${styles.main}`}>
          {/* Banner Peringatan Ramah Jika Terjadi Duplikasi */}
          {duplicateWarning && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                marginBottom: '16px',
                borderRadius: '14px',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                background: 'rgba(120, 53, 15, 0.35)',
                color: '#FEF3C7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: '#FBBF24', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.92rem', color: '#FDE68A' }}>
                    Pemberitahuan Duplikasi Data
                  </strong>
                  <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{duplicateWarning}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                aria-label="Tutup peringatan"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FDE68A',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className={styles.hero} aria-labelledby="dashboard-heading">
            <span className={styles.heroEyebrow}>
              <HeartHandshake size={15} />
              Portal Bimbingan & Kesehatan Mental Siswa
            </span>
            <h2 id="dashboard-heading" className="student-dashboard-welcome-title">
              Selamat Datang di Ruang Tenang
            </h2>
            <p className="student-dashboard-welcome-description">
              Pilih waktu luangmu, pilih guru BK favoritmu. Konseling jadi lebih privat dan terjadwal.
            </p>
            <nav className={styles.quickActions} aria-label="Akses cepat">
              <Link className={`${styles.quickAction} ${styles.primaryAction}`} href="/booking">
                <CalendarDays size={16} />
                Booking Konseling BK
                <ArrowRight size={15} />
              </Link>
              <Link className={styles.quickAction} href="/curhat">
                <MessageSquareHeart size={16} />
                Curhat Anonim
              </Link>
              <Link className={styles.quickAction} href="/jurnal">
                <BookOpen size={16} />
                Mulai Menulis Jurnal
              </Link>
            </nav>
          </section>

          {/* Ringkasan Agregat Aktivitas Siswa (Dinamis & Responsif) */}
          <section
            aria-labelledby="agregat-heading"
            style={{
              marginTop: '20px',
              marginBottom: '20px',
              padding: '18px',
              borderRadius: '18px',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              background: 'rgba(15, 41, 29, 0.72)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} style={{ color: '#52B788' }} />
                <div>
                  <h2 id="agregat-heading" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Ringkasan Aktivitas Saya
                  </h2>
                  <p style={{ fontSize: '0.78rem', opacity: 0.75, margin: 0 }}>
                    Data agregat otomatis sesuai akun siswa Anda
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.utilityButton}
                onClick={() => loadStudentAgregat(studentIdentifier)}
                disabled={isLoadingAgregat}
              >
                <RefreshCw size={14} />
                {isLoadingAgregat ? 'Memuat...' : 'Segarkan statistik'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {agregatCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(209, 250, 229, 0.12)',
                    background: 'rgba(8, 24, 16, 0.78)',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.8 }}>
                    {card.label}
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '1.45rem',
                      fontWeight: 700,
                      marginTop: '4px',
                      marginBottom: '4px',
                      color: card.accent,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {isLoadingAgregat ? '...' : card.value}
                  </strong>
                  <small style={{ display: 'block', fontSize: '0.74rem', opacity: 0.68 }}>
                    {card.sub}
                  </small>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.affirmation} aria-label="Afirmasi harian">
            <span className={styles.quoteIcon}><Quote size={20} /></span>
            <div className={styles.affirmationCopy} aria-live="polite">
              <span className={styles.sectionEyebrow}>Afirmasi untukmu hari ini</span>
              <p>“{affirmations[affirmationIndex]}”</p>
            </div>
            <div className={styles.affirmationActions}>
              <button type="button" className={styles.utilityButton} onClick={handleNextAffirmation}>
                <RefreshCw size={14} />
                Ganti afirmasi
              </button>
              <button type="button" className={styles.utilityButton} onClick={handleCopyAffirmation}>
                {copyStatus === 'Kutipan tersalin' ? <Check size={14} /> : <Copy size={14} />}
                {copyStatus === 'Kutipan tersalin' ? 'Tersalin' : 'Salin kutipan'}
              </button>
              <button type="button" className={`${styles.utilityButton} ${styles.breathingButton}`} onClick={handleOpenBreathing}>
                <Wind size={14} />
                Latihan napas 1 menit
              </button>
              {copyStatus && <span className={styles.copyStatus} role="status">{copyStatus}</span>}
            </div>
          </section>

          <section className={styles.servicesSection} aria-labelledby="services-heading">
            <div className={styles.sectionHeading}>
              <h2 id="services-heading">Fitur Utama Ruang Tenang</h2>
              <p>Pilih layanan sesuai kebutuhanmu</p>
            </div>
            <div className={styles.serviceGrid}>
              {services.map(({ href, title, description, action, Icon, tone }) => (
                <Link className={styles.serviceCard} href={href} key={href}>
                  <span className={`${styles.serviceIcon} ${styles[tone]}`}>
                    <Icon size={22} />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className={styles.serviceAction}>
                    {action}
                    <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <footer className={styles.footer}>
            <strong>Ruang Tenang — Tempat Berbagi Cerita</strong>
            <span>Identitasmu aman. Semua curhat terlindungi.</span>
            <small>© 2026 Ruang Tenang · SMK Budi Bakti Ciwidey</small>
          </footer>
        </main>
      </div>

      {isBreathingOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={handleCloseBreathing}
          onKeyDown={(event) => {
            if (event.key === 'Escape') handleCloseBreathing();
          }}
        >
          <section
            aria-labelledby="breathing-title"
            aria-modal="true"
            className={styles.breathingModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button type="button" className={styles.closeButton} onClick={handleCloseBreathing} aria-label="Tutup latihan napas">
              <X size={18} />
            </button>
            <span className={styles.modalIcon}><Wind size={20} /></span>
            <h2 id="breathing-title">Jeda sejenak</h2>
            <p className={styles.breathingDescription}>
              Ikuti ritme perlahan ini. Tarik napas, tahan sebentar, lalu hembuskan dengan tenang.
            </p>
            <div className={`${styles.breathOrb} ${isBreathing ? styles.breathing : ''}`} aria-live="polite">
              {breathingComplete ? (
                <span>Selesai</span>
              ) : isBreathing ? (
                <span>{getBreathingPhase(breathingSeconds)}</span>
              ) : (
                <span>Siap?</span>
              )}
            </div>
            <span className={styles.timerText}>
              {breathingComplete ? 'Bagus, kamu sudah meluangkan waktu untuk dirimu.' : `${breathingSeconds} detik`}
            </span>
            {isBreathing ? (
              <button type="button" className={styles.startButton} onClick={handleCloseBreathing}>Akhiri latihan</button>
            ) : breathingComplete ? (
              <button type="button" className={styles.startButton} onClick={handleCloseBreathing}>Selesai</button>
            ) : (
              <button type="button" className={styles.startButton} onClick={handleStartBreathing}>Mulai latihan</button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}