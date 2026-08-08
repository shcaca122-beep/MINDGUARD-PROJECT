'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
        @media (max-width: 768px) {
          .login-card {
            flex-direction: column !important;
            max-width: 100% !important;
            margin: 12px !important;
            border-radius: 16px !important;
          }
          .login-right-panel {
            display: none !important;
          }
          .login-left-panel {
            padding: 32px 20px !important;
          }
        }
      ` }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* CARD UTAMA (RESPONSIF SPLIT SCREEN) */}
        <div
          className="login-card"
          style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: 'rgba(2, 31, 24, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            width: '100%',
            maxWidth: '920px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          {/* SISI KIRI: FORM LOGIN */}
          <div
            className="login-left-panel"
            style={{
              flex: 1,
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              zIndex: 2,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#064e3b',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}
              >
                <Shield size={22} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>MindGuard</span>
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
              Masuk ke Sistem
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#a7f3d0' }}>
              Sistem Monitoring Kedisiplinan & Bimbingan Siswa
            </p>

            {/* ALERT ERROR */}
            {errorMsg && (
              <div
                style={{
                  backgroundColor: '#7f1d1d',
                  color: '#fee2e2',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  border: '1px solid #f87171',
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* FORM LOGIN */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  Email / Akun
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: '#021f18',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: '#021f18',
                      color: '#ffffff',
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
                      color: '#94a3b8',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                  color: '#ffffff',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{isLoading ? 'Memeriksa Akun...' : 'Masuk ke Sistem'}</span>
                {!isLoading && <ArrowRight size={16} />}
              </button>
            </form>

            <span style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              &copy; 2026 Z-Solution - SMK Budi Bakti Ciwidey
            </span>
          </div>

          {/* SISI KANAN: PANEL BRANDING & FITUR (HIDDEN ON MOBILE) */}
          <div
            className="login-right-panel"
            style={{
              flex: 1.1,
              background: 'linear-gradient(135deg, #047857 0%, #065f46 50%, #022c22 100%)',
              color: '#ffffff',
              padding: '48px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              borderTopLeftRadius: '140px',
              borderBottomLeftRadius: '140px',
              borderLeft: '1px solid rgba(52, 211, 153, 0.2)',
              boxSizing: 'border-box',
            }}
          >
            {/* Ornamen Lingkaran Transparan Latar Belakang */}
            <div
              style={{
                position: 'absolute',
                right: '-60px',
                bottom: '-60px',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                zIndex: 1,
              }}
            />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#a7f3d0',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'inline-block',
                  marginBottom: '16px',
                  border: '1px solid rgba(167, 243, 208, 0.3)',
                }}
              >
                SMK Budi Bakti Ciwidey
              </span>

              <h1 style={{ margin: '0 0 12px 0', fontSize: '36px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                MindGuard
              </h1>
              
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.6', color: '#e2e8f0', maxWidth: '360px' }}>
                Platform terintegrasi untuk pemantauan kedisiplinan siswa, pencatatan pelanggaran gerbang, layanan bimbingan konseling, dan perizinan sekolah secara real-time.
              </p>

              {/* DAFTAR FITUR UTAMA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Panel Khusus OSIS & MPK (Pemeriksaan Gerbang)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Monitoring Poin Pelanggaran & Guru BK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Layanan Konseling & Curhat Anonim Siswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}