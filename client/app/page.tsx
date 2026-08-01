'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';// 1. IMPORT CLIENT SUPABASE

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State indikator loading

  // HANDLER LOGIN DENGAN SUPABASE (SUPPORT NISN & EMAIL)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const inputClean = email.trim();

    try {
      // 2. CEK LANGSUNG KE TABEL USERS DI SUPABASE
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq."${inputClean}",nisn.eq."${inputClean}"`)
        .eq('password', password);

      if (error) {
        setErrorMessage('Gagal memproses database: ' + error.message);
        setIsLoading(false);
        return;
      }

      if (!users || users.length === 0) {
        setErrorMessage('Email/NISN atau password salah! Silakan periksa kembali.');
        setIsLoading(false);
        return;
      }

      const userFound = users[0];

      // 3. SIMPAN SESSION SISWA/USER KE LOCALSTORAGE
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', userFound.role);
      localStorage.setItem('userEmail', userFound.email || '');
      localStorage.setItem('userNama', userFound.nama || 'Siswa');
      localStorage.setItem('userKelas', userFound.kelas || '-');
      localStorage.setItem('userNisn', userFound.nisn || '-');

      // REDIRECT BERDASARKAN ROLE DARI DATABASE
      let targetPath = '/dashboard';
      if (userFound.role === 'Guru BK' || userFound.role === 'Admin') {
        targetPath = '/bk';
      } else if (userFound.role === 'Guru Piket') {
        targetPath = '/piket';
      }

      router.push(targetPath);
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style jsx>{`
        .login-wrapper {
          font-family: sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #d1f2d9;
          padding: 20px;
          box-sizing: border-box;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background-color: #ffffff;
          box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.08);
          border-radius: 24px;
          padding: 36px 32px;
          box-sizing: border-box;
          border: 1px solid #b5d8b6;
        }

        .input-group {
          display: flex;
          align-items: center;
          background-color: #f3f4f6;
          padding: 12px 16px;
          border-radius: 30px;
          border: 1px solid #e5e7eb;
          margin-top: 6px;
        }

        .input-field {
          border: none;
          background-color: transparent;
          outline: none;
          width: 100%;
          font-weight: bold;
          font-size: 13px;
          color: #111827;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="login-card">
        {/* LOGO MINDGUARD */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#1b3b2b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '900', fontSize: '18px', color: '#1b3b2b', letterSpacing: '0.5px' }}>MindGuard</div>
            <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>SMK Budi Bakti Ciwidey</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', margin: '0 0 6px 0' }}>Sign In</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Masukkan kredensial akun terdaftar Anda</p>
        </div>

        {/* PESAN ERROR SAAT SALAH LOGIN */}
        {errorMessage && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* INPUT NISN / EMAIL (Diuat type="text" agar NISN tidak terbaca error) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>Email / NISN</label>
            <div className="input-group">
              <span style={{ marginRight: '10px', opacity: 0.6 }}>👤</span>
              <input
                type="text"
                required
                placeholder="Masukkan NISN atau Email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* INPUT PASSWORD */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>Password</label>
            <div className="input-group">
              <span style={{ marginRight: '10px', opacity: 0.6 }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '0 4px',
                  outline: 'none',
                  opacity: 0.7
                }}
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* TOMBOL SIGN IN */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '10px',
              padding: '14px',
              backgroundColor: isLoading ? '#6b7280' : '#1b3b2b',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '14px',
              border: 'none',
              borderRadius: '30px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(27, 59, 43, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Memeriksa Database...' : 'Masuk Aplikasi'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Powered by Z-solution © 2026</span>
        </div>
      </div>
    </div>
  );
}