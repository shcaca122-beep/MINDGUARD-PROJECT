'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false); // State untuk toggle menu mobile

  // Menutup sidebar secara otomatis saat pengguna berpindah halaman di mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        setUser({
          nama: parsed.nama || parsed.email || 'Pengguna',
          role: (parsed.role || 'SISWA').toUpperCase(),
        });
      } catch (err) {
        console.error('Error parsing session:', err);
      }
    }
  }, []);

const handleLogout = () => {
    // 1. Hapus data sesi login dari browser
    localStorage.removeItem('user_session');
    
    // 2. Arahkan kembali ke halaman utama (localhost:3000/)
    router.push('/'); 
  };

  
  const roleUpper = user?.role || '';
  const isPiket = roleUpper.includes('PIKET');
  const isBK = roleUpper.includes('BK');
  const isOSIS = roleUpper.includes('OSIS') || roleUpper.includes('MPK');

  return (
    <>
      {/* 1. HEADER & TOMBOL HAMBURGER (Hanya muncul di Layar HP/Tablet) */}
      <div className="mobile-header">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="hamburger-btn"
          aria-label="Toggle Navigation"
        >
          {isOpen ? '✕' : '☰'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '16px' }}>MindGuard</span>
        </div>
      </div>

      {/* 2. OVERLAY GELAP (Muncul di Mobile saat Sidebar Terbuka) */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* 3. CONTAINER SIDEBAR */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div>
          {/* LOGO BRAND */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', padding: '0 8px' }}>
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>MindGuard</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#a7f3d0' }}>
                {isPiket ? 'Panel Guru Piket' : isBK ? 'Panel Guru BK' : isOSIS ? 'Panel OSIS & MPK' : 'Ruang Tenang Siswa'}
              </p>
            </div>
          </div>

          {/* PROFILE CARD */}
          <div style={{ backgroundColor: '#2d523e', padding: '12px', borderRadius: '8px', marginBottom: '25px' }}>
            <div style={{ fontSize: '10px', color: '#86efac', fontWeight: 'bold' }}>Aktif Sebagai:</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px', wordBreak: 'break-word' }}>
              {user?.nama || 'Memuat...'} ({user?.role || 'SISWA'})
            </div>
          </div>

          {/* MENU NAVIGASI */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* 1. KHUSUS GURU PIKET */}
            {isPiket && (
              <Link 
                href="/piket" 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', color: '#ffffff', backgroundColor: '#2d523e', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}
              >
                📋 Panel Utama Piket
              </Link>
            )}

            {/* 2. KHUSUS GURU BK */}
            {isBK && (
              <>
                <Link href="/bk" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  🧠 Panel Utama BK
                </Link>
                <Link href="/bk/curhat" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk/curhat' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk/curhat' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  📩 Pesan Curhat Siswa
                </Link>
                <Link href="/bk/konseling" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk/konseling' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk/konseling' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  👤 Konseling Individual
                </Link>
                <Link href="/bk/perizinan" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk/perizinan' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk/perizinan' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  📝 Izin & Sakit Siswa
                </Link>
                <Link href="/bk/home-visit" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk/home-visit' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk/home-visit' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  🏠 Home Visit
                </Link>
                <Link href="/bk/panggilan-ortu" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/bk/panggilan-ortu' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/bk/panggilan-ortu' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  📞 Panggilan Orang Tua
                </Link>
              </>
            )}

            {/* 3. KHUSUS OSIS & MPK */}
            {isOSIS && (
              <Link 
                href="/osis" 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', color: '#ffffff', backgroundColor: '#2d523e', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}
              >
                ⏰ Input Keterlambatan
              </Link>
            )}

            {/* 4. KHUSUS SISWA BIASA */}
            {!isPiket && !isBK && !isOSIS && (
              <>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/dashboard' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/dashboard' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  🏠 Beranda
                </Link>
                <Link href="/curhat" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/curhat' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/curhat' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  💬 Curhat ke Guru BK
                </Link>
                <Link href="/jurnal" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/jurnal' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/jurnal' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  📖 Menulis Jurnal Harian
                </Link>
                <Link href="/perizinan" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: pathname === '/perizinan' ? '#ffffff' : '#a7f3d0', backgroundColor: pathname === '/perizinan' ? '#2d523e' : 'transparent', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                  📝 Perizinan Siswa
                </Link>
              </>
            )}

          </nav>
        </div>

        <div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🚪 Keluar (Logout)
          </button>
          <div style={{ fontSize: '10px', color: '#86efac', textAlign: 'center', marginTop: '12px' }}>
            SMK BUDI BAKTI CIWIDEY
          </div>
        </div>
      </aside>

      {/* 4. CSS DEDIKASI UNTUK RESPONSIFITAS */}
      <style jsx>{`
        /* Header Mobile */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background-color: #1b3b2b;
          padding: 0 16px;
          align-items: center;
          gap: 12px;
          z-index: 40;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hamburger-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 4px;
        }

        /* Container Utama Sidebar */
        .sidebar-container {
          width: 260px;
          background-color: #1b3b2b;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 15px;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          transition: transform 0.3s ease-in-out;
          overflow-y: auto;
        }

        /* Overlay */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 45;
        }

        /* MEDIA QUERY: Layar HP/Tablet (Lebar < 768px) */
        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }

          .sidebar-container {
            transform: translateX(-100%);
            top: 0;
          }

          .sidebar-container.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}