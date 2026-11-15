'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
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

function getBreathingPhase(secondsLeft: number): BreathingPhase {
  const elapsed = (60 - secondsLeft) % 12;
  if (elapsed < 4) return 'Tarik napas';
  if (elapsed < 6) return 'Tahan';
  return 'Hembuskan';
}

export default function DashboardPage() {
  const router = useRouter();
  const [userNama, setUserNama] = useState('Siswa');
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(60);
  const [breathingComplete, setBreathingComplete] = useState(false);

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

        const session = JSON.parse(sessionData) as {
          nama?: string;
          role?: string;
          isAdmin?: boolean;
        };
        const role = (session.role || '').toUpperCase();

        if (session.nama) setUserNama(session.nama);

        if (session.isAdmin === true || role.includes('ADMIN') || role === 'TU' || role.includes('TATA USAHA')) {
          router.replace('/admin1');
        } else if (role.includes('OSIS') || role.includes('MPK')) {
          router.replace('/osis');
        } else if (role.includes('PIKET')) {
          router.replace('/piket');
        } else if (role.includes('BK')) {
          router.replace('/bk');
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        router.replace('/');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

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
