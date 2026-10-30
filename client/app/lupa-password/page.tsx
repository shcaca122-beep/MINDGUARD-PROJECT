'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Layanan pemulihan kata sandi belum tersedia. Silakan hubungi administrator.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      setErrorMessage('Masukkan email aktif yang terdaftar. Jika biasanya masuk memakai NISN, hubungi administrator untuk bantuan reset.');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setInfoMessage('Jika email tersebut terdaftar dan dapat menerima pesan, tautan pemulihan akan dikirim. Periksa juga folder spam. Akun siswa yang hanya menggunakan NISN atau email sementara perlu meminta bantuan administrator.');
    } catch (error: unknown) {
      console.error('Permintaan reset kata sandi gagal:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Tautan pemulihan gagal dikirim. Silakan coba lagi.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(145deg, #07140f 0%, #0b1d16 55%, #10271e 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '440px', padding: '32px', border: '1px solid rgba(110, 231, 183, 0.2)', borderRadius: '20px', background: 'linear-gradient(145deg, #101f19 0%, #13251d 100%)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.42)', color: '#e5eee8', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#a7f3d0' }}>
          <KeyRound size={22} />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>PEMULIHAN AKUN</span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Lupa kata sandi?</h1>
        <p style={{ margin: '0 0 22px', color: '#a9c5b7', fontSize: '14px', lineHeight: 1.55 }}>
          Masukkan email aktif yang terdaftar. Kami akan mengirim tautan untuk membuat kata sandi baru.
        </p>
        {errorMessage && <p role="alert" style={{ margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#451a1a', color: '#fecaca', fontSize: '13px' }}>{errorMessage}</p>}
        {infoMessage && <p role="status" style={{ margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#123b2d', color: '#d1fae5', fontSize: '13px', lineHeight: 1.5 }}>{infoMessage}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '7px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
            Email terdaftar
            <span style={{ position: 'relative' }}>
              <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid #355747', borderRadius: '9px', background: '#0b1712', color: '#f1f5f9', outline: 'none' }}
              />
            </span>
          </label>
          <button type="submit" disabled={isSending} style={{ padding: '13px', border: 0, borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: isSending ? 'wait' : 'pointer' }}>
            {isSending ? 'Mengirim tautan...' : 'Kirim tautan pemulihan'}
          </button>
        </form>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '20px', color: '#a7f3d0', fontSize: '13px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Kembali ke halaman masuk
        </Link>
      </section>
    </main>
  );
}
