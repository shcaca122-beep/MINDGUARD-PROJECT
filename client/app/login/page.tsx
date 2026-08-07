'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simpan session dummy
    localStorage.setItem('user_session', JSON.stringify({ nama: 'Siswa MindGuard', role: 'SISWA' }));
    router.push('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>Selamat Datang!</h2>
          <p className="auth-desc">Masuk untuk mengakses layanan Bimbingan Konseling MindGuard.</p>
        </div>
        <form onSubmit={handleLogin} className="auth-right">
          <h2 className="auth-title">Login MindGuard</h2>
          <input type="text" placeholder="NISN / Email" className="input-box" required />
          <input type="password" placeholder="Password" className="input-box" required />
          <button type="submit" className="secondary-btn">Masuk</button>
        </form>
      </div>
    </div>
  );
}