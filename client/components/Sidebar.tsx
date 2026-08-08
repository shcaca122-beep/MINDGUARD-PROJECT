'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Shield,
  Menu,
  X,
  LayoutDashboard,
  MessageSquareText,
  UserCheck,
  ClipboardList,
  Home,
  PhoneCall,
  Clock,
  MessageCircle,
  BookOpen,
  FileText,
  LogOut,
  GraduationCap
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    localStorage.removeItem('user_session');
    router.push('/');
  };

  const roleUpper = user?.role || '';
  const isPiket = roleUpper.includes('PIKET');
  const isBK = roleUpper.includes('BK');
  const isOSIS = roleUpper.includes('OSIS') || roleUpper.includes('MPK');

  const getLinkStyle = (path: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    color: pathname === path ? '#ffffff' : '#a7f3d0',
    backgroundColor: pathname === path ? '#2d523e' : 'transparent',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: pathname === path ? '600' : '500',
    transition: 'all 0.2s ease-in-out',
  });

  return (
    <>
      {/* 1. HEADER & TOMBOL HAMBURGER MOBILE */}
      <div className="mobile-header">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hamburger-btn"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={22} className="text-emerald-400" color="#86efac" />
          <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '16px' }}>MindGuard</span>
        </div>
      </div>

      {/* 2. OVERLAY MOBILE */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 6px 16px 6px' }}>
            <div style={{ backgroundColor: '#2d523e', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="#86efac" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '-0.025em' }}>MindGuard</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#86efac' }}>
                {isPiket ? 'Panel Guru Piket' : isBK ? 'Panel Guru BK' : isOSIS ? 'Panel OSIS & MPK' : 'Ruang Tenang Siswa'}
              </p>
            </div>
          </div>

          {/* GARIS PEMBATAS ATAS */}
          <div className="sidebar-divider" />

          {/* PROFILE CARD */}
          <div style={{ backgroundColor: '#142d20', border: '1px solid #2d523e', padding: '12px', borderRadius: '8px', margin: '14px 0' }}>
            <div style={{ fontSize: '10px', color: '#86efac', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Aktif Sebagai
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginTop: '3px', wordBreak: 'break-word' }}>
              {user?.nama || 'Memuat...'}
            </div>
            <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>
              Role: {user?.role || 'SISWA'}
            </div>
          </div>

          {/* GARIS PEMBATAS MENU */}
          <div className="sidebar-divider" style={{ marginBottom: '14px' }} />

          {/* MENU NAVIGASI */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            {/* KHUSUS GURU PIKET */}
            {isPiket && (
              <Link href="/piket" style={getLinkStyle('/piket')}>
                <ClipboardList size={18} />
                <span>Panel Utama Piket</span>
              </Link>
            )}

            {/* KHUSUS GURU BK */}
            {isBK && (
              <>
                <Link href="/bk" style={getLinkStyle('/bk')}>
                  <LayoutDashboard size={18} />
                  <span>Panel Utama BK</span>
                </Link>
                <Link href="/bk/curhat" style={getLinkStyle('/bk/curhat')}>
                  <MessageSquareText size={18} />
                  <span>Pesan Curhat Siswa</span>
                </Link>
                <Link href="/bk/konseling" style={getLinkStyle('/bk/konseling')}>
                  <UserCheck size={18} />
                  <span>Konseling Individual</span>
                </Link>
                <Link href="/bk/perizinan" style={getLinkStyle('/bk/perizinan')}>
                  <ClipboardList size={18} />
                  <span>Izin & Sakit Siswa</span>
                </Link>
                <Link href="/bk/home-visit" style={getLinkStyle('/bk/home-visit')}>
                  <Home size={18} />
                  <span>Home Visit</span>
                </Link>
                <Link href="/bk/panggilan-ortu" style={getLinkStyle('/bk/panggilan-ortu')}>
                  <PhoneCall size={18} />
                  <span>Panggilan Orang Tua</span>
                </Link>
              </>
            )}

            {/* KHUSUS OSIS & MPK */}
            {isOSIS && (
              <Link href="/osis" style={getLinkStyle('/osis')}>
                <Clock size={18} />
                <span>Input Keterlambatan</span>
              </Link>
            )}

            {/* KHUSUS SISWA */}
            {!isPiket && !isBK && !isOSIS && (
              <>
                <Link href="/dashboard" style={getLinkStyle('/dashboard')}>
                  <Home size={18} />
                  <span>Beranda</span>
                </Link>
                <Link href="/curhat" style={getLinkStyle('/curhat')}>
                  <MessageCircle size={18} />
                  <span>Curhat ke Guru BK</span>
                </Link>
                <Link href="/jurnal" style={getLinkStyle('/jurnal')}>
                  <BookOpen size={18} />
                  <span>Menulis Jurnal Harian</span>
                </Link>
                <Link href="/perizinan" style={getLinkStyle('/perizinan')}>
                  <FileText size={18} />
                  <span>Perizinan Siswa</span>
                </Link>
              </>
            )}

          </nav>
        </div>

        {/* FOOTER & LOGOUT */}
        <div style={{ marginTop: '20px' }}>
          {/* GARIS PEMBATAS SEBELUM LOGOUT */}
          <div className="sidebar-divider" style={{ marginBottom: '14px' }} />

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: '#bd1515',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#701c1c')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#bd1515')}
          >
            <LogOut size={16} />
            <span>Keluar (Logout)</span>
          </button>

          <div style={{ fontSize: '10px', color: '#86efac', textAlign: 'center', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.8 }}>
            <GraduationCap size={14} />
            <span>SMK BUDI BAKTI CIWIDEY</span>
          </div>
        </div>
      </aside>

      {/* 4. CSS STYLING */}
      <style jsx>{`
        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(45, 82, 62, 0) 0%, #2d523e 50%, rgba(45, 82, 62, 0) 100%);
          width: 100%;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background-color: #1b3b2b;
          border-bottom: 1px solid #2d523e;
          padding: 0 16px;
          align-items: center;
          gap: 12px;
          z-index: 40;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .hamburger-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-container {
          width: 260px;
          background-color: #1b3b2b;
          border-right: 1px solid #2d523e;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 14px;
          box-sizing: border-box;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          transition: transform 0.3s ease-in-out;
          overflow-y: auto;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          z-index: 45;
        }

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