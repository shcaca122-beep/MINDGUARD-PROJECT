'use client';

import { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    if (password.length < 12) {
      setErrorMessage('Password pribadi harus minimal 12 karakter.');
      return;
    }
    if (password !== confirmation) {
      setErrorMessage('Konfirmasi password belum sama.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/complete-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.reLoginRequired) {
          window.location.replace('/');
          return;
        }
        throw new Error(result.error || 'Password baru gagal disimpan.');
      }
      window.location.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Password baru gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #021f18 0%, #032c22 55%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '440px', padding: '32px', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '20px', background: 'rgba(2, 31, 24, 0.96)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', color: '#f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#34d399' }}>
          <KeyRound size={22} />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>KEAMANAN AKUN</span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: '25px', color: '#fff' }}>Buat password pribadi</h1>
        <p style={{ margin: '0 0 22px', color: '#a7f3d0', fontSize: '14px', lineHeight: 1.55 }}>
          Password sementara sudah digunakan untuk login. Sebelum melanjutkan, buat password pribadi baru minimal 12 karakter.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
            Password baru
            <span style={{ position: 'relative' }}>
              <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                minLength={12}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '9px', background: '#021f18', color: '#fff', outline: 'none' }}
              />
            </span>
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>
            Ulangi password baru
            <span style={{ position: 'relative' }}>
              <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                minLength={12}
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 40px', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '9px', background: '#021f18', color: '#fff', outline: 'none' }}
              />
            </span>
          </label>
          {errorMessage && <p role="alert" style={{ margin: 0, color: '#fca5a5', fontSize: '13px' }}>{errorMessage}</p>}
          <button type="submit" disabled={isSaving} style={{ marginTop: '4px', padding: '13px', border: 0, borderRadius: '9px', background: '#059669', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: isSaving ? 'wait' : 'pointer' }}>
            {isSaving ? 'Menyimpan...' : 'Simpan password pribadi'}
          </button>
        </form>
      </section>
    </main>
  );
}
