'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

type ErrorScreenProps = {
  eyebrow?: string;
  title: string;
  description: string;
  reference?: string;
  onRetry?: () => void;
};

export default function ErrorScreen({
  eyebrow = 'TERJADI GANGGUAN',
  title,
  description,
  reference,
  onRetry,
}: ErrorScreenProps) {
  return (
    <main className="mindguard-error-page">
      <div className="mindguard-error-glow mindguard-error-glow-top" aria-hidden="true" />
      <div className="mindguard-error-glow mindguard-error-glow-bottom" aria-hidden="true" />

      <section className="mindguard-error-card" aria-labelledby="error-title">
        <div className="mindguard-error-brand">
          <span className="mindguard-error-brand-icon">
            <ShieldCheck size={21} strokeWidth={2.2} />
          </span>
          <span>MindGuard</span>
          <span className="mindguard-error-brand-divider" />
          <span className="mindguard-error-brand-caption">SMK Budi Bakti Ciwidey</span>
        </div>

        <div className="mindguard-error-content">
          <div className="mindguard-error-icon" aria-hidden="true">
            <AlertTriangle size={30} strokeWidth={1.8} />
          </div>

          <p className="mindguard-error-eyebrow">{eyebrow}</p>
          <h1 id="error-title">{title}</h1>
          <p className="mindguard-error-description">{description}</p>

          {reference && (
            <p className="mindguard-error-reference">
              Kode referensi: <span>{reference}</span>
            </p>
          )}

          <div className="mindguard-error-actions">
            {onRetry && (
              <button className="mindguard-error-retry" onClick={onRetry} type="button">
                <RefreshCw size={17} />
                Coba lagi
              </button>
            )}
            <Link className="mindguard-error-home" href="/">
              <ArrowLeft size={17} />
              Kembali ke beranda
            </Link>
          </div>
        </div>

        <footer className="mindguard-error-footer">
          Jika kendala terus muncul, silakan hubungi Guru BK atau administrator sekolah.
        </footer>
      </section>
    </main>
  );
}
