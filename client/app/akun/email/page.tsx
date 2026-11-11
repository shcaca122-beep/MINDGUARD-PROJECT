'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudentRecoveryEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (profileError || profile?.role !== 'siswa') {
        router.replace('/dashboard');
        return;
      }

      if (!isMounted) return;
      const currentEmail = user.email || '';
      const isInternalEmail =
        currentEmail.endsWith('@students.budibakti.sch.id') ||
        /^[0-9]{10}@budibakti\.sch\.id$/.test(currentEmail);
      setRegisteredEmail(isInternalEmail ? '' : currentEmail);
      setEmail(isInternalEmail ? '' : currentEmail);

      if (user.email && user.email_confirmed_at && !isInternalEmail) {
        const response = await fetch('/api/auth/student-recovery-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync' }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (isMounted) setErrorMessage(result.error || 'Email terverifikasi, tetapi data akun belum dapat disinkronkan.');
        } else if (isMounted) {
          setRegisteredEmail(result.email || currentEmail);
          setEmail(result.email || currentEmail);
        }
      }

      if (isMounted) setIsLoading(false);
    };

    void loadAccount().catch((error: unknown) => {
      console.error('Gagal memuat email pemulihan siswa:', error);
      if (isMounted) {
        setErrorMessage('Gagal memuat data akun. Silakan coba lagi.');
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/auth/student-recovery-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengirim verifikasi email.');

      setInfoMessage('Tautan verifikasi telah dikirim ke Gmail tersebut. Buka emailnya dan tekan tautan verifikasi agar bisa digunakan untuk pemulihan kata sandi.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengirim verifikasi email. Silakan coba lagi.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(145deg, #07140f 0%, #0b1d16 55%, #10271e 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '460px', padding: '32px', border: '1px solid rgba(110, 231, 183, 0.2)', borderRadius: '20px', background: 'linear-gradient(145deg, #101f19 0%, #13251d 100%)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.42)', color: '#e5eee8', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#a7f3d0' }}>
          <Mail size={22} />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>PEMULIHAN KATA SANDI</span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Daftarkan Email untuk Reset Kata Sandi</h1>
        <p style={{ margin: '0 0 20px', color: '#a9c5b7', fontSize: '14px', lineHeight: 1.55 }}>
          Masukkan Gmail pribadi yang aktif. Setelah diVerifikasi, email ini dapat menerima tautan untuk mengatur ulang kata sandi jika Anda lupa.
        </p>
        {registeredEmail && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#123b2d', color: '#d1fae5', fontSize: '13px', overflowWrap: 'anywhere' }}>
            <CheckCircle2 size={17} /> Gmail terdaftar: {registeredEmail}
          </p>
        )}
        {errorMessage && <p role="alert" style={{ margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#451a1a', color: '#fecaca', fontSize: '13px' }}>{errorMessage}</p>}
        {infoMessage && <p role="status" style={{ margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#123b2d', color: '#d1fae5', fontSize: '13px', lineHeight: 1.5 }}>{infoMessage}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '7px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
            Gmail pribadi
            <span style={{ position: 'relative' }}>
              <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@gmail.com"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid #355747', borderRadius: '9px', background: '#0b1712', color: '#f1f5f9', outline: 'none' }}
              />
            </span>
          </label>
          <button type="submit" disabled={isLoading || isSending} style={{ padding: '13px', border: 0, borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: isSending ? 'wait' : 'pointer' }}>
            {isLoading ? 'Memuat akun...' : isSending ? 'Mengirim verifikasi...' : 'Kirim tautan verifikasi'}
          </button>
        </form>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '20px', color: '#a7f3d0', fontSize: '13px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Kembali ke dashboard
        </Link>
      </section>
    </main>
  );
}
