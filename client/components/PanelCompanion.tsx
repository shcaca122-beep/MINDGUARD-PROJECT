'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Heart, Sparkles, X } from 'lucide-react';

type PanelCompanionProps = {
  audience: 'student' | 'bk' | 'osis' | 'piket' | 'admin';
  placement?: 'floating' | 'sidebar';
};

const companionContent = {
  student: {
    greeting: 'Hai! Aku Mindy 🌱',
    message: 'Mau mulai dari mana hari ini? Pilih yang terasa nyaman buatmu.',
    links: [
      { href: '/booking', label: 'Atur sesi konseling' },
      { href: '/curhat', label: 'Cerita ke Guru BK' },
      { href: '/jurnal', label: 'Tulis jurnal pribadi' },
    ],
  },
  bk: {
    greeting: 'Halo, Bapak/Ibu Guru BK!',
    message: 'Terima kasih sudah menjadi ruang aman bagi para siswa.',
    links: [
      { href: '/bk/curhat', label: 'Lihat pesan siswa' },
      { href: '/bk/konseling', label: 'Kelola konseling' },
      { href: '/bk', label: 'Kembali ke panel BK' },
    ],
  },
  osis: {
    greeting: 'Hai, Tim OSIS & MPK!',
    message: 'Terima kasih sudah menjaga gerbang sekolah dengan peduli.',
    links: [
      { href: '/osis', label: 'Input keterlambatan' },
      { href: '/osis/rekap-mingguan', label: 'Buka rekap mingguan' },
    ],
  },
  piket: {
    greeting: 'Halo, Guru Piket!',
    message: 'Semoga tugas hari ini berjalan lancar. Butuh membuka panel piket?',
    links: [
      { href: '/piket', label: 'Buka panel piket' },
      { href: '/osis/rekap-mingguan', label: 'Lihat rekap mingguan' },
    ],
  },
  admin: {
    greeting: 'Halo, Admin MindGuard!',
    message: 'Semua data dan layanan sekolah bisa diakses dari panelmu.',
    links: [
      { href: '/admin1/siswa', label: 'Kelola data siswa' },
      { href: '/admin1/guru', label: 'Kelola data guru' },
      { href: '/admin1', label: 'Kembali ke dashboard' },
    ],
  },
} satisfies Record<PanelCompanionProps['audience'], {
  greeting: string;
  message: string;
  links: { href: string; label: string }[];
}>;

export default function PanelCompanion({ audience, placement = 'floating' }: PanelCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const content = companionContent[audience];

  if (pathname === '/admin1/login') return null;

  return (
    <div className={`panel-companion${audience === 'student' ? ' panel-companion-student' : ''}${placement === 'sidebar' ? ' panel-companion-sidebar' : ''}`}>
      {isOpen && (
        <section className="panel-companion-popover" id="panel-companion-message" aria-label="Bantuan Mindy">
          <div className="panel-companion-heading">
            <span className="panel-companion-avatar" aria-hidden="true">
              <i />
              <i />
              <b />
            </span>
            <span>
              <strong>{content.greeting}</strong>
              <small><span /> Mindy siap membantu</small>
            </span>
            <button
              type="button"
              className="panel-companion-close"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup bantuan Mindy"
            >
              <X size={16} />
            </button>
          </div>
          <p>{content.message}</p>
          <nav aria-label="Pintasan dari Mindy">
            {content.links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                <span>{link.label}</span>
                <ArrowRight size={14} />
              </Link>
            ))}
          </nav>
          <div className="panel-companion-note"><Heart size={12} /> Pelan-pelan, satu langkah saja.</div>
        </section>
      )}
      <button
        type="button"
        className={`panel-companion-trigger${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="panel-companion-message"
        aria-label={isOpen ? 'Tutup bantuan Mindy' : 'Buka bantuan Mindy'}
      >
        {isOpen ? <X size={21} /> : <span className="panel-companion-trigger-face"><i /><i /><b /></span>}
        {!isOpen && <span className="panel-companion-trigger-sparkle"><Sparkles size={12} /></span>}
      </button>
    </div>
  );
}
