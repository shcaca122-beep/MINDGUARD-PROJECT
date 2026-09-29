'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
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
  
  const [adminName, setAdminName] = useState('STAF IT & TATA USAHA');
  const [adminRole, setAdminRole] = useState('TU');
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_nama');
    router.replace('/');
  };

  const navItemStyle = (path: string, id: string) => {
    const active = pathname === path;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 10px',
      borderRadius: '6px',
      color: active ? '#34d399' : hoveredIndex === id ? '#34d399' : '#cbd5e1',
      backgroundColor: active ? 'rgba(52, 211, 153, 0.1)' : hoveredIndex === id ? '#13261f' : 'transparent',
      textDecoration: 'none',
      fontSize: '12px',
      fontWeight: active ? '700' : '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  if (!isAuthorized) return null;

  return (
    <div className="admin-panel"
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
      {/* ================= SIDEBAR ================= */}
      <aside className="admin-panel-sidebar"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', boxSizing: 'border-box' }}>
              <Image
                src="/logo-mindguard.jpeg"
                alt="Logo MindGuard"
                width={32}
                height={32}
                priority
                unoptimized
                style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', display: 'block' }}>MindGuard</span>
              <span style={{ fontSize: '10px', color: '#688c7d', fontWeight: '600' }}>Panel Konseling</span>
            </div>
          </div>

          {/* User Info Box */}
          <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', color: '#688c7d', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>AKTIF SEBAGAI</div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
            <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
              Role: {adminRole}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              onClick={() => router.push('/admin1')}
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
                <div onClick={() => router.push('/admin1/guru')} onMouseEnter={() => setHoveredIndex('guru')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/guru', 'guru')}>
                  <UserCheck size={14} /> <span>Data Guru</span>
                </div>
                <div onClick={() => router.push('/admin1/siswa')} onMouseEnter={() => setHoveredIndex('siswa')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/siswa', 'siswa')}>
                  <GraduationCap size={14} /> <span>Data Siswa</span>
                </div>
                <div onClick={() => router.push('/admin1/layanan')} onMouseEnter={() => setHoveredIndex('layanan')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/layanan', 'layanan')}>
                  <Layers size={14} /> <span>Jenis Layanan</span>
                </div>
                <div onClick={() => router.push('/admin1/profil')} onMouseEnter={() => setHoveredIndex('profil')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/profil', 'profil')}>
                  <School size={14} /> <span>Profil Sekolah</span>
                </div>
              </div>
            </div>

            {/* Section: KEGIATAN BK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#567568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KEGIATAN BK</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div onClick={() => router.push('/admin1/konseling')} onMouseEnter={() => setHoveredIndex('konseling')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/konseling', 'konseling')}>
                  <Calendar size={14} /> <span>Sesi Konseling</span>
                </div>
                <div onClick={() => router.push('/admin1/pelanggaran')} onMouseEnter={() => setHoveredIndex('pelanggaran')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/pelanggaran', 'pelanggaran')}>
                  <AlertTriangle size={14} /> <span>Pelanggaran Siswa</span>
                </div>
              </div>
            </div>

            {/* Section: LAPORAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#567568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LAPORAN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div onClick={() => router.push('/admin1/laporan-konseling')} onMouseEnter={() => setHoveredIndex('lap-konseling')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/laporan-konseling', 'lap-konseling')}>
                  <FileText size={14} /> <span>Laporan Konseling</span>
                </div>
                <div onClick={() => router.push('/admin1/laporan-pelanggaran')} onMouseEnter={() => setHoveredIndex('lap-pelanggaran')} onMouseLeave={() => setHoveredIndex(null)} style={navItemStyle('/admin1/laporan-pelanggaran', 'lap-pelanggaran')}>
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
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#567568' }}>SMK Budi Bakti Ciwidey</div>
        </div>
      </aside>

      {/* Area Konten Dinamis */}
      <main className="admin-panel-main" style={{ flex: 1, minWidth: 0, backgroundColor: '#0e1a15', border: '1px solid #193328', borderRadius: '12px', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}