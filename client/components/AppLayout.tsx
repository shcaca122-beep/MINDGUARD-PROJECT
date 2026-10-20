'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // TAMBAHKAN '/' DI SINI agar Sidebar hilang di localhost:3000 maupun /login
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  // Jika halaman Login (di '/' atau '/login'), tampilkan FULL SCREEN tanpa Sidebar
  if (isAuthPage) {
    return (
      <div style={{ width: '100%', minHeight: '100vh' }}>
        {children}
      </div>
    );
  }

  // Halaman biasa (Dashboard, BK, dll) tetap pakai Sidebar
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}