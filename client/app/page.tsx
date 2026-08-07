'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 🔍 1. Cek dulu ke tabel admin_roles (Untuk BK, Piket, OSIS, Admin)
      let { data: user } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', password)
        .maybeSingle();

      // 🔍 2. Jika tidak ada di admin_roles, cari di tabel users (Untuk Siswa)
      if (!user) {
        const { data: siswaUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', password)
          .maybeSingle();

        user = siswaUser;
      }

      // Jika di kedua tabel tidak ditemukan
      if (!user) {
        throw new Error('Email atau password salah! Silakan periksa kembali.');
      }

      // 💾 3. Simpan Data Sesi Pengguna ke LocalStorage
      const userRole = (user.role || 'siswa').toLowerCase();
      const sessionData = {
        id: user.id,
        email: user.email,
        nama: user.nama || user.email,
        role: userRole,
        kelas: user.kelas || '-',
      };

      localStorage.setItem('user_session', JSON.stringify(sessionData));

      // 🔀 4. Redirect Otomatis Berdasarkan Role
      if (userRole.includes('bk')) {
        router.push('/bk');
      } else if (userRole.includes('piket')) {
        router.push('/piket');
      } else if (userRole.includes('osis') || userRole.includes('mpk')) {
        router.push('/osis');
      } else if (userRole.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Gagal login. Silakan periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#d1f2d9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '36px 32px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {/* LOGO BRAND */}
        <div
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#1b3b2b',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
          }}
        >
          🛡️
        </div>

        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold', color: '#1b3b2b' }}>
          MindGuard Login
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>
          SMK Budi Bakti Ciwidey
        </p>

        {/* ALERT ERROR */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '18px',
              border: '1px solid #fca5a5',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              📧 Email
            </label>
            <input
              type="email"
              required
              placeholder="Contoh: bk@smkbudibakti.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
              🔒 Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: '#1b3b2b',
              color: '#ffffff',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}
          >
            {isLoading ? '⌛ Memeriksa Akun...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '11px', color: '#64748b' }}>
          &copy; 2026 Z-Solution - SMK Budi Bakti Ciwidey
        </p>
      </div>
    </div>
  );
}