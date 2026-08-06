'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        throw new Error('Email atau password salah! Silakan periksa kembali.');
      }

      localStorage.setItem('user_session', JSON.stringify(data));

      if (data.role === 'siswa' || data.kelas) {
        router.push('/dashboard');
      } else {
        router.push('/admin');
      }

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-left">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#1b3b2b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              margin: '0 auto 12px auto',
              boxShadow: '0 4px 10px rgba(27, 59, 43, 0.2)'
            }}>
              🛡️
            </div>
            <h2 className="auth-title">MindGuard Login</h2>
            <p className="auth-desc">SMK Budi Bakti Ciwidey</p>
          </div>
        </div>

        <div className="auth-right">
          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '16px',
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>✉️ Email</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="masukkan.email@smkbudibakti.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>🔒 Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', padding: 0 }}>{showPassword ? '👁️' : '🙈'}</button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="submit-btn">{isLoading ? '⌛ Memproses...' : 'Masuk ke Sistem'}</button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
            &copy; {new Date().getFullYear()} Z-Solution - SMK Budi Bakti Ciwidey
          </div>
        </div>

      </div>
    </div>
  );
}