'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

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
      if (!isSupabaseConfigured) {
        throw new Error('Konfigurasi Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_ANON_KEY atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dengan API key dari project Supabase yang benar, lalu restart server.');
      }

      const cleanEmail = email.trim().toLowerCase();

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_roles')
        .select('*')
        .ilike('email', cleanEmail)
        .eq('password', password)
        .maybeSingle();

      if (adminError) {
        throw new Error(`Gagal mengakses tabel admin_roles: ${adminError.message}`);
      }

      let user = adminUser;
      let isAdminTable = false;

      if (user) {
        isAdminTable = true;
      } else {
        const { data: siswaUser, error: siswaError } = await supabase
          .from('users')
          .select('*')
          .ilike('email', cleanEmail)
          .eq('password', password)
          .maybeSingle();

        if (siswaError) {
          throw new Error(`Gagal mengakses tabel users: ${siswaError.message}`);
        }

        user = siswaUser;
      }

      if (!user) {
        throw new Error('Email atau password salah! Silakan periksa kembali.');
      }

      // 💾 3. PERBAIKAN BUG ROLE:
      // Jika user ditemukan di admin_roles tapi kolom role-nya null/kosong,
      // default-kan ke 'admin' (BUKAN 'siswa').
      const rawRole = user.role || user.jabatan || user.role_name || '';
      const normalizedRole = String(rawRole).trim().toLowerCase();
      const isAdminRole = normalizedRole.includes('admin')
        || normalizedRole === 'tu'
        || normalizedRole.includes('tata usaha');
      const isOperationalRole = ['bk', 'piket', 'osis', 'mpk']
        .some((role) => normalizedRole.includes(role));
      const isAdminAccount = isAdminRole || (isAdminTable && !isOperationalRole);
      const userRole = normalizedRole || (isAdminAccount ? 'admin' : 'siswa');

      const sessionData = {
        id: user.id,
        email: user.email,
        nama: user.nama || user.email,
        role: userRole,
        isAdmin: isAdminAccount,
        kelas: user.kelas || '-',
      };

      localStorage.setItem('user_session', JSON.stringify(sessionData));
      localStorage.setItem('user_role', userRole.toUpperCase());
      const middlewareRole = isAdminAccount
        ? 'admin'
        : userRole.includes('bk')
          ? 'bk'
          : userRole.includes('piket')
            ? 'piket'
            : userRole.includes('osis') || userRole.includes('mpk')
              ? 'osis'
              : userRole;
      document.cookie = `user_role=${encodeURIComponent(middlewareRole)}; path=/; max-age=86400; samesite=lax`;
      if (isAdminAccount) {
        localStorage.setItem('admin_nama', sessionData.nama);
        localStorage.setItem('admin_role', userRole.toUpperCase());
      } else {
        localStorage.removeItem('admin_nama');
        localStorage.removeItem('admin_role');
      }

      // 🔀 4. Redirect Otomatis Berdasarkan Role
      if (isAdminAccount) {
        router.push('/admin1');
      } else if (userRole.includes('bk')) {
        router.push('/bk');
      } else if (userRole.includes('piket')) {
        router.push('/piket');
      } else if (userRole.includes('osis') || userRole.includes('mpk')) {
        router.push('/osis');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal login. Silakan periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
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
            border-radius: 20px !important;
          }
          .login-right-panel {
            display: none !important;
          }
          .login-left-panel {
            padding: 36px 24px !important;
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
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* CARD UTAMA */}
        <div
          className="login-card"
          style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: 'rgba(2, 31, 24, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            width: '100%',
            maxWidth: '1080px',
            minHeight: '580px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(52, 211, 153, 0.25)',
          }}
        >
          {/* SISI KIRI: FORM LOGIN */}
          <div
            className="login-left-panel"
            style={{
              flex: 1,
              padding: '56px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              zIndex: 2,
              boxSizing: 'border-box',
            }}
          >
            {/* BRANDING HEADER / LOGO FORM LOGIN */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#064e3b',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '5px',
                  boxSizing: 'border-box',
                }}
              >
                <Image
                  src="/logo-mindguard.jpeg"
                  alt="MindGuard Logo"
                  width={38}
                  height={38}
                  unoptimized
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'screen',
                  }}
                />
              </div>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                MindGuard
              </span>
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Masuk ke Sistem
            </h2>
            <p style={{ margin: '0 0 28px 0', fontSize: '14px', color: '#a7f3d0', lineHeight: '1.5' }}>
              Sistem Monitoring Kedisiplinan & Bimbingan Siswa
            </p>

            {/* ALERT ERROR */}
            {errorMsg && (
              <div
                style={{
                  backgroundColor: '#7f1d1d',
                  color: '#fee2e2',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  border: '1px solid #f87171',
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* FORM LOGIN */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
                  Email / Akun
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      backgroundColor: '#021f18',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      fontSize: '14px',
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
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                  color: '#ffffff',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <span>{isLoading ? 'Memeriksa Akun...' : 'Masuk ke Sistem'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <span style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              &copy; 2026 SR-Solution - SMK Budi Bakti Ciwidey
            </span>
          </div>

          {/* SISI KANAN: PANEL BRANDING & FITUR */}
          <div
            className="login-right-panel"
            style={{
              flex: 1.15,
              background: 'linear-gradient(135deg, #047857 0%, #065f46 50%, #022c22 100%)',
              color: '#ffffff',
              padding: '56px 52px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              borderTopLeftRadius: '160px',
              borderBottomLeftRadius: '160px',
              borderLeft: '1px solid rgba(52, 211, 153, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '-50px',
                bottom: '-50px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                zIndex: 1,
              }}
            />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#a7f3d0',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'inline-block',
                  marginBottom: '20px',
                  border: '1px solid rgba(167, 243, 208, 0.3)',
                }}
              >
                SMK Budi Bakti Ciwidey
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Image
                  src="/logo-mindguard.jpeg"
                  alt="MindGuard Big Logo"
                  width={56}
                  height={56}
                  unoptimized
                  style={{
                    width: '56px',
                    height: '56px',
                    objectFit: 'contain',
                    mixBlendMode: 'screen',
                  }}
                />
                <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '900', letterSpacing: '-1px' }}>
                  MindGuard
                </h1>
              </div>

              <p style={{ margin: '0 0 28px 0', fontSize: '15px', lineHeight: '1.6', color: '#e2e8f0', maxWidth: '420px' }}>
                Platform terintegrasi untuk pemantauan kedisiplinan siswa, pencatatan pelanggaran gerbang, dan layanan bimbingan konseling secara real-time.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>Panel Khusus OSIS & MPK (Pemeriksaan Gerbang)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span>Monitoring Poin Pelanggaran & Guru BK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#a7f3d0' }}>
                  <CheckCircle2 size={18} color="#34d399" />
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