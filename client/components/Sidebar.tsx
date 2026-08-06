'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: 'Beranda', path: '/dashboard', icon: '🏠' },
    { name: 'Booking BK / Konseling', path: '/booking', icon: '📅' },
    { name: 'Curhat Anonim', path: '/curhat', icon: '📩' },
    { name: 'Jurnal Pribadi', path: '/jurnal', icon: '📘' },
    { name: 'Perizinan Siswa', path: '/perizinan', icon: '📝' },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button className="hamburger" onClick={() => setOpen((s) => !s)} aria-label="Toggle menu">☰</button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div>
          <div className="brand">
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <div>
              <div className="title">MindGuard</div>
              <div className="subtitle">Ruang Tenang Siswa</div>
            </div>
          </div>

          <nav>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  style={{
                    fontWeight: isActive ? 'bold' : 500,
                    backgroundColor: isActive ? '#2d523e' : 'transparent',
                    color: isActive ? '#ffffff' : '#a7f3d0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="footer">
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>SMK BUDI BAKTI CIWIDEY</div>
          <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '2px' }}>&copy; 2026 Ruang Tenang Z-Solution</div>
        </div>
      </aside>
    </>
  );
}