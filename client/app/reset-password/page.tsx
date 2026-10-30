'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [canResetPassword, setCanResetPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [completionMessage, setCompletionMessage] = useState('Silakan masuk kembali menggunakan kata sandi baru.');
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) setCanResetPassword(true);
      if (event === 'SIGNED_OUT') setCanResetPassword(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setErrorMessage('Tautan pemulihan tidak dapat diverifikasi. Silakan minta tautan baru.');
      } else if (data.session) {
        setCanResetPassword(true);
      }
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    if (password.length < 12) {
      setErrorMessage('Kata sandi harus minimal 12 karakter.');
      return;
    }
    if (password !== confirmation) {
      setErrorMessage('Konfirmasi kata sandi belum sama.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Kata sandi berubah, tetapi sesi belum berhasil ditutup:', signOutError);
        setCompletionMessage('Kata sandi berhasil diubah, tetapi sesi tidak dapat ditutup otomatis. Silakan keluar lalu masuk kembali menggunakan kata sandi baru.');
      }
      setIsComplete(true);
    } catch (error: unknown) {
      console.error('Penyimpanan kata sandi baru gagal:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Kata sandi baru gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(145deg, #07140f 0%, #0b1d16 55%, #10271e 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '440px', padding: '32px', border: '1px solid rgba(110, 231, 183, 0.2)', borderRadius: '20px', background: 'linear-gradient(145deg, #101f19 0%, #13251d 100%)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.42)', color: '#e5eee8', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#a7f3d0' }}>
          <KeyRound size={22} />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>KEAMANAN AKUN</span>
        </div>
        {isComplete ? (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Kata sandi berhasil diubah</h1>
            <p style={{ margin: '0 0 22px', color: '#a9c5b7', fontSize: '14px', lineHeight: 1.55 }}>{completionMessage}</p>
            <Link href="/" style={{ display: 'block', padding: '13px', borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800, fontSize: '14px', textAlign: 'center', textDecoration: 'none' }}>Kembali ke halaman masuk</Link>
          </>
        ) : !isCheckingSession && !canResetPassword ? (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Tautan tidak valid atau kedaluwarsa</h1>
            <p style={{ margin: '0 0 22px', color: '#a9c5b7', fontSize: '14px', lineHeight: 1.55 }}>Minta tautan pemulihan baru, lalu buka tautan terbaru dari email Anda.</p>
            <Link href="/lupa-password" style={{ display: 'block', padding: '13px', borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800, fontSize: '14px', textAlign: 'center', textDecoration: 'none' }}>Minta tautan baru</Link>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Buat kata sandi baru</h1>
            <p style={{ margin: '0 0 22px', color: '#a9c5b7', fontSize: '14px', lineHeight: 1.55 }}>Gunakan kata sandi minimal 12 karakter.</p>
            {errorMessage && <p role="alert" style={{ margin: '0 0 16px', padding: '11px 13px', borderRadius: '9px', background: '#451a1a', color: '#fecaca', fontSize: '13px' }}>{errorMessage}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
                Kata sandi baru
                <span style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid #355747', borderRadius: '9px', background: '#0b1712', color: '#f1f5f9', outline: 'none' }} />
                </span>
              </label>
              <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
                Ulangi kata sandi baru
                <span style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input required minLength={12} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid #355747', borderRadius: '9px', background: '#0b1712', color: '#f1f5f9', outline: 'none' }} />
                </span>
              </label>
              <button type="submit" disabled={isCheckingSession || isSaving} style={{ padding: '13px', border: 0, borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: isSaving ? 'wait' : 'pointer' }}>
                {isSaving ? 'Menyimpan...' : 'Simpan kata sandi baru'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
