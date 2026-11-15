'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MindGuardMark from '@/components/MindGuardMark';
import PanelCompanion from '@/components/PanelCompanion';
import { 
  Menu,
  X,
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  School, 
  LogOut, 
  BarChart3, 
  GraduationCap, 
  Layers, 
  FileText 
} from 'lucide-react';

export default function Admin1Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLightTheme = false;
  
  const [adminName, setAdminName] = useState('STAF IT & TATA USAHA');
  const [adminRole, setAdminRole] = useState('TU');
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      router.replace('/');
      return;
    }

    try {
      const session = JSON.parse(savedSession);
      const role = String(session.role || '').trim().toLowerCase();
      const isAdmin = session.isAdmin === true
        || role.includes('admin')
        || role === 'tu'
        || role.includes('tata usaha');

      if (!isAdmin) {
        router.replace('/dashboard');
        return;
      }

      const savedNama = localStorage.getItem('admin_nama') || session.nama;
      const savedRole = localStorage.getItem('admin_role') || session.role;
      // Hydrate the client-only session details after mounting.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedNama) setAdminName(savedNama.toUpperCase());
      if (savedRole) setAdminRole(savedRole.toUpperCase());
      setIsAuthorized(true);
    } catch {
      localStorage.removeItem('user_session');
      router.replace('/');
    }
  }, [router]);

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await supabase.auth.signOut();
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_nama');
    router.replace('/');
  };

  const navItemStyle = (path: string, id: string) => {
    const active = pathname === path;
    const hovered = hoveredIndex === id;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '9px 10px',
      borderRadius: '6px',
      color: isLightTheme
        ? active || hovered ? '#334155' : '#475569'
        : active || hovered ? '#34d399' : '#cbd5e1',
      backgroundColor: isLightTheme
        ? active ? '#e9eef3' : hovered ? '#f3f6f8' : 'transparent'
        : active ? 'rgba(52, 211, 153, 0.1)' : hovered ? '#13261f' : 'transparent',
      textDecoration: 'none',
      fontSize: '12px',
      fontWeight: active ? '700' : '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  if (!isAuthorized) return null;

  return (
    <div
      className="admin-panel"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#07100d',
        color: '#f1f5f9',
        fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        padding: '16px',
        gap: '16px',
        boxSizing: 'border-box'
      }}
    >
      {/* ================= HEADER MOBILE (HAMBURGER) ================= */}
      <header className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Buka atau tutup menu admin"
            style={{
              backgroundColor: '#13261f',
              border: '1px solid #1d3d30',
              color: '#34d399',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <MindGuardMark size={32} />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', display: 'block', lineHeight: 1.1 }}>MindGuard</span>
            <span style={{ fontSize: '10px', color: '#688c7d', fontWeight: '600' }}>Panel Admin</span>
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#34d399', backgroundColor: '#13261f', border: '1px solid #1d3d30', padding: '4px 9px', borderRadius: '999px' }}>
          {adminRole}
        </span>
      </header>

      {/* ================= OVERLAY MOBILE ================= */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`admin-panel-sidebar ${isMobileMenuOpen ? 'is-open' : ''}`}
        style={{
          width: '260px',
          flexShrink: 0,
          backgroundColor: '#0e1a15',
          border: '1px solid #193328',
          borderRadius: '12px',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          {/* Logo Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="admin-panel-brand-mark" style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: isLightTheme ? '#174d3a' : 'rgba(52, 211, 153, 0.12)', border: `1px solid ${isLightTheme ? '#3b8a69' : 'rgba(52, 211, 153, 0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', boxSizing: 'border-box', overflow: 'hidden' }}>
                <MindGuardMark size={38} />
              </div>
              <div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', display: 'block' }}>MindGuard</span>
                <span style={{ fontSize: '10px', color: '#688c7d', fontWeight: '600' }}>Panel Konseling</span>
              </div>
            </div>
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Info Box */}
          <div className="admin-panel-user-card" style={{ background: isLightTheme ? 'linear-gradient(145deg, #f2f8f5 0%, #eaf3ef 100%)' : '#13261f', border: `1px solid ${isLightTheme ? '#d4e4dc' : '#1d3d30'}`, borderRadius: '8px', padding: '12px', marginBottom: '20px', boxShadow: isLightTheme ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(42,73,80,0.05)' : undefined }}>
            <div style={{ fontSize: '9px', color: isLightTheme ? '#648074' : '#688c7d', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>AKTIF SEBAGAI</div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: isLightTheme ? '#243b32' : '#ffffff', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
            <div style={{ fontSize: '10px', color: isLightTheme ? '#47745f' : '#34d399', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
              Role: {adminRole}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={() => navigateTo('/admin1')}
              style={navItemStyle('/admin1', 'dashboard')}
              onMouseEnter={() => setHoveredIndex('dashboard')}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </div>

            {/* Section: DATA MASTER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#567568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DATA MASTER</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div onClick={() => navigateTo('/admin1/guru')} onMouseEnter={() => setHoveredIndex('guru')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/guru', 'guru')}>
                  <UserCheck size={14} /> <span>Data Admin</span>
                </div>
                <div onClick={() => navigateTo('/admin1/siswa')} onMouseEnter={() => setHoveredIndex('siswa')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/siswa', 'siswa')}>
                  <GraduationCap size={14} /> <span>Data Siswa</span>
                </div>
                <div onClick={() => navigateTo('/admin1/layanan')} onMouseEnter={() => setHoveredIndex('layanan')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/layanan', 'layanan')}>
                  <Layers size={14} /> <span>Jenis Layanan</span>
                </div>
                <div onClick={() => navigateTo('/admin1/profil')} onMouseEnter={() => setHoveredIndex('profil')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/profil', 'profil')}>
                  <School size={14} /> <span>Profil Sekolah</span>
                </div>
              </div>
            </div>

            {/* Section: KEGIATAN BK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#567568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KEGIATAN BK</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div onClick={() => navigateTo('/admin1/konseling')} onMouseEnter={() => setHoveredIndex('konseling')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/konseling', 'konseling')}>
                  <Calendar size={14} /> <span>Sesi Konseling</span>
                </div>
                <div onClick={() => navigateTo('/admin1/pelanggaran')} onMouseEnter={() => setHoveredIndex('pelanggaran')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/pelanggaran', 'pelanggaran')}>
                  <AlertTriangle size={14} /> <span>Pelanggaran Siswa</span>
                </div>
              </div>
            </div>

            {/* Section: LAPORAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#567568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LAPORAN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div onClick={() => navigateTo('/admin1/laporan-konseling')} onMouseEnter={() => setHoveredIndex('lap-konseling')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/laporan-konseling', 'lap-konseling')}>
                  <FileText size={14} /> <span>Laporan Konseling</span>
                </div>
                <div onClick={() => navigateTo('/admin1/laporan-pelanggaran')} onMouseEnter={() => setHoveredIndex('lap-pelanggaran')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/laporan-pelanggaran', 'lap-pelanggaran')}>
                  <FileText size={14} /> <span>Laporan Pelanggaran</span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #193328' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', padding: '10px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}
          >
            <LogOut size={14} /> <span>Keluar (Logout)</span>
          </button>
          <div className="sidebar-mindy">
            <div className="sidebar-mindy-copy">
              <strong>Teman Mindy</strong>
              <span>Ketuk untuk bantuan</span>
            </div>
            <PanelCompanion audience="admin" placement="sidebar" />
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#567568' }}>SMK Budi Bakti Ciwidey</div>
        </div>
      </aside>

      {/* Area Konten Dinamis */}
      <main className="admin-panel-main" style={{ flex: 1, minWidth: 0, backgroundColor: '#0e1a15', border: '1px solid #193328', borderRadius: '12px', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
        {children}
      </main>

      <style jsx global>{`
        .admin-mobile-header,
        .admin-mobile-overlay,
        .admin-sidebar-close-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .admin-panel {
            flex-direction: column !important;
            width: 100% !important;
            padding: 12px !important;
            gap: 12px !important;
            overflow-x: hidden;
          }

          .admin-mobile-header {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            background-color: #0e1a15;
            border: 1px solid #193328;
            border-radius: 12px;
            padding: 10px 14px;
            position: sticky;
            top: 12px;
            z-index: 30;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          }

          .admin-mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(2px);
            z-index: 45;
          }

          .admin-sidebar-close-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background-color: #13261f;
            border: 1px solid #1d3d30;
            color: #cbd5e1;
            cursor: pointer;
          }

          .admin-panel-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 270px !important;
            max-width: 82vw !important;
            height: 100dvh !important;
            border-radius: 0 14px 14px 0 !important;
            z-index: 50 !important;
            overflow-y: auto !important;
            transform: translateX(-105%) !important;
            transition: transform 0.25s ease-in-out !important;
            box-shadow: 12px 0 32px rgba(0, 0, 0, 0.5) !important;
          }

          .admin-panel-sidebar.is-open {
            transform: translateX(0) !important;
          }

          .admin-panel-main {
            width: 100% !important;
            padding: 16px !important;
          }

          .admin-panel-main table {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          .admin-panel-main th,
          .admin-panel-main td {
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}