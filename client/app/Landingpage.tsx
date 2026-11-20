'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MindGuardMark from '@/components/MindGuardMark';
import {
  ArrowDown,
  ArrowRight,
  BookHeart,
  Check,
  Heart,
  Leaf,
  LockKeyhole,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

const highlights = [
  {
    icon: MessageCircleHeart,
    title: 'Ruang untuk bercerita',
    description: 'Sampaikan cerita dan perasaanmu dengan nyaman, termasuk melalui curhat anonim.',
    tone: 'mint',
  },
  {
    icon: ShieldCheck,
    title: 'Pendampingan yang terarah',
    description: 'Layanan BK, konseling, dan pemantauan siswa dalam satu ruang yang terintegrasi.',
    tone: 'blue',
  },
  {
    icon: Heart,
    title: 'Tumbuh tanpa menghakimi',
    description: 'Informasi dan dukungan yang membantu setiap siswa merasa didengar dan dihargai.',
    tone: 'peach',
  },
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSection, setActiveSection] = useState('Tentang');

  useEffect(() => {
    const updateScrollState = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 120);

      const triggerPoint = window.innerHeight * 0.45;
      const caraKerjaEl = document.getElementById('cara-kerja');
      const fiturEl = document.getElementById('fitur');

      if (caraKerjaEl && caraKerjaEl.getBoundingClientRect().top <= triggerPoint) {
        setActiveSection('Cara kerja');
      } else if (fiturEl && fiturEl.getBoundingClientRect().top <= triggerPoint) {
        setActiveSection('Layanan');
      } else {
        setActiveSection('Tentang');
      }
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const isCompact = isScrolled && !isHovered;

  return (
    <main className="mindguard-landing">
      <header
        className={`landing-nav${isCompact ? ' is-compact' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (isCompact) setIsHovered(true);
        }}
      >
        {isCompact ? (
          <div className="landing-compact-pill" role="status" aria-live="polite">
            <span className="landing-compact-dot" aria-hidden="true" />
            <span className="landing-compact-label">{activeSection}</span>
          </div>
        ) : (
          <>
            <Link className="landing-brand" href="/" aria-label="MindGuard beranda">
              <span className="landing-brand-logo">
                <MindGuardMark size={34} />
              </span>
              <span>mindguard<span className="landing-brand-period">.</span></span>
            </Link>
            <nav className="landing-nav-links" aria-label="Navigasi utama">
              <a href="#tentang">Tentang</a>
              <a href="#fitur">Layanan</a>
              <a href="#cara-kerja">Cara kerja</a>
            </nav>
            <Link className="landing-login-link" href="/login">
              Masuk <ArrowRight size={15} />
            </Link>
          </>
        )}
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span /> RUANG AMAN UNTUK BERTUMBUH</div>
          <h1 style={{ letterSpacing: '-0.01em', wordSpacing: '0.12em', lineHeight: 1.15 }}>
            Jaga langkahmu.
            <br />
            <span>Rawat dirimu.</span>
          </h1>
          <p className="landing-hero-description">
            Setiap cerita berarti. MindGuard hadir untuk menemani perjalananmu
            dengan dukungan, bimbingan, dan ruang yang lebih nyaman di sekolah.
          </p>
          <div className="landing-hero-actions">
            <Link className="landing-primary-button" href="/login">
              Mulai perjalananmu <ArrowRight size={17} />
            </Link>
            <a className="landing-secondary-button" href="#tentang">
              Kenali MindGuard <ArrowDown size={16} />
            </a>
          </div>
          <div className="landing-safe-note">
            <span className="landing-safe-icon"><LockKeyhole size={14} /></span>
            Ruang yang mengutamakan kepedulian dan privasi
          </div>
        </div>

        <div className="landing-hero-art" aria-label="Ilustrasi ruang tenang MindGuard">
          <div className="landing-art-glow" />
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="landing-float-icon landing-float-leaf"><Leaf size={21} /></div>
          <div className="landing-float-icon landing-float-heart"><Heart size={20} /></div>
          <div className="landing-float-icon landing-float-sparkle"><Sparkles size={19} /></div>
          <div className="landing-art-card">
            <div className="landing-art-card-top">
              <span className="landing-art-brand-mark">
                <MindGuardMark size={30} />
              </span>
              <span><strong>Ruang tenangmu</strong><small>Hari ini, mulai dari dirimu</small></span>
              <span className="landing-art-live"><i /> aman</span>
            </div>
            <div className="landing-landscape">
              <div className="landing-landscape-sun" />
              <div className="landing-landscape-mountain landing-mountain-back" />
              <div className="landing-landscape-mountain landing-mountain-front" />
              <div className="landing-landscape-hill" />
              <div className="landing-landscape-path" />
              <div className="landing-landscape-tree landing-tree-left"><i /><b /></div>
              <div className="landing-landscape-tree landing-tree-right"><i /><b /></div>
              <div className="landing-landscape-star star-one">✦</div>
              <div className="landing-landscape-star star-two">✦</div>
              <div className="landing-landscape-caption">
                <span>Tarik napas,</span>
                <strong>kamu tidak sendiri.</strong>
              </div>
            </div>
            <div className="landing-art-card-bottom">
              <span className="landing-mood-dot" />
              <span>Langkah kecil tetap berarti</span>
              <ArrowRight size={15} />
            </div>
          </div>
          <div className="landing-note-card">
            <span><Heart size={15} fill="currentColor" /></span>
            <div><strong>Perasaanmu valid.</strong><small>Ceritakan kapan saja.</small></div>
          </div>
          <div className="landing-note-card landing-note-card-bottom">
            <span><Leaf size={15} /></span>
            <div><strong>Tumbuh dengan tenang</strong><small>Satu hari, satu langkah.</small></div>
          </div>
        </div>
        <a className="landing-scroll-hint" href="#tentang"><span /> Gulir untuk mengenal lebih jauh</a>
      </section>

      <section className="landing-intro" id="tentang">
        <div className="landing-section-kicker">TENTANG MINDGUARD <span /></div>
        <div className="landing-intro-grid">
          <h2>Tempat yang lebih baik<br />untuk <span>merasa didengar.</span></h2>
          <p>
            Sekolah bukan hanya tentang pelajaran. Ini juga tentang mengenal diri,
            melewati tantangan, dan menemukan orang-orang yang siap mendengarkan.
            MindGuard menyatukan dukungan itu dalam satu tempat.
          </p>
        </div>
      </section>

      <section className="landing-features" id="fitur">
        <div className="landing-features-heading">
          <div>
            <div className="landing-section-kicker">DIRANCANG DENGAN PEDULI <span /></div>
            <h2>Dukungan yang terasa<br /><span>lebih dekat.</span></h2>
          </div>
          <p>Alat yang bermakna untuk siswa, guru BK, dan komunitas sekolah.</p>
        </div>
        <div className="landing-feature-grid">
          {highlights.map(({ icon: Icon, title, description, tone }, index) => (
            <article className={`landing-feature-card landing-feature-${tone}`} key={title}>
              <div className="landing-feature-card-top">
                <span className="landing-feature-icon"><Icon size={21} /></span>
                <span className="landing-feature-number">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="landing-feature-arrow"><ArrowRight size={17} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-steps" id="cara-kerja">
        <div className="landing-steps-art" aria-hidden="true">
          <div className="landing-steps-orbit"><span /><span /><span /></div>
          <div className="landing-steps-center"><BookHeart size={42} /></div>
          <div className="landing-steps-chip landing-chip-one"><MessageCircleHeart size={17} /> Cerita</div>
          <div className="landing-steps-chip landing-chip-two"><UsersRound size={17} /> Dukungan</div>
          <div className="landing-steps-chip landing-chip-three"><Sparkles size={17} /> Bertumbuh</div>
        </div>
        <div className="landing-steps-copy">
          <div className="landing-section-kicker">MULAI DARI SINI <span /></div>
          <h2>Langkah kecil.<br /><span>Perubahan berarti.</span></h2>
          <p>
            Masuk ke akun sekolahmu untuk melihat layanan yang tersedia dan
            menemukan dukungan yang sesuai dengan kebutuhanmu.
          </p>
          <ul>
            <li><Check size={16} /> Jelajahi layanan siswa dan konseling</li>
            <li><Check size={16} /> Hubungi guru BK dengan lebih mudah</li>
            <li><Check size={16} /> Pantau informasi dan aktivitas sekolah</li>
          </ul>
          <Link className="landing-primary-button" href="/login">Masuk ke MindGuard <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-glow" />
        <span className="landing-cta-icon"><Heart size={20} /></span>
        <div className="landing-section-kicker">KAMU PANTAS DIDENGAR <span /></div>
        <h2>Tak harus menghadapi<br /><span>semuanya sendirian.</span></h2>
        <p>Mulai dari satu langkah kecil. Kami siap menemanimu.</p>
        <Link className="landing-primary-button" href="/login">Temukan ruangmu <ArrowRight size={17} /></Link>
      </section>

      <footer className="landing-footer">
        <Link className="landing-brand" href="/">
          <span className="landing-brand-logo"><MindGuardMark size={32} /></span>
          <span>mindguard<span className="landing-brand-period">.</span></span>
        </Link>
        <span>Ruang aman untuk tumbuh, SMK Budi Bakti Ciwidey.</span>
        <Link href="/login">Masuk ke akun <ArrowRight size={14} /></Link>
      </footer>
    </main>
  );
}