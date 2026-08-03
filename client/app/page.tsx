'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect otomatis berdasarkan email/NISN
    if (email.includes('admin') || email.includes('bk')) {
      router.push('/bk');
    } else {
      router.push('/siswa');
    }
  };

  return (
    <div style={{
      backgroundColor: '#cbe3cd',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* CARD FORM LOGIN RAPI & CENTER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '36px 32px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
        border: '1px solid #b5d8b6',
        boxSizing: 'border-box'
      }}>
        
        {/* LOGO & HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#1b3b2b',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '12px',
            boxShadow: '0 4px 10px rgba(27, 59, 43, 0.3)'
          }}>
            🛡️
          </div>
          <h1 style={{ margin: '0 0 2px 0', fontSize: '24px', fontWeight: 'bold', color: '#1b3b2b' }}>
            MindGuard
          </h1>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>
            SMK Budi Bakti Ciwidey
          </p>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
            Sign In
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            Masukkan kredensial akun terdaftar Anda
          </p>
        </div>

        {/* FORM INPUT LOGIN */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Email / NISN
            </label>
            <input
              required
              type="text"
              placeholder="admin@budibakti.sch.id / NISN"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingRight: '40px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
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
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#1b3b2b',
              color: '#ffffff',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Masuk Aplikasi
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
          Powered by Z-solution © 2026
        </div>
      </div>
    </div>
  );
}