'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [userNama, setUserNama] = useState('Siswa');

  // AUTOMATIC REDIRECT BERDASARKAN ROLE
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const role = (session.role || '').toUpperCase();
        
        if (session.nama) {
          setUserNama(session.nama);
        }

        // 🔀 Pengalihan Otomatis Sesuai Role Account
        if (role.includes('OSIS') || role.includes('MPK')) {
          router.push('/osis');
        } else if (role.includes('PIKET')) {
          router.push('/piket');
        } else if (role.includes('BK')) {
          router.push('/bk');
        }
      } catch (err) {
        console.error('Error parsing session:', err);
      }
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Konten Utama Dashboard Siswa */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* Topbar */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
            Dashboard Ruang Tenang
          </h2>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b' }}>
            👋 Selamat Datang, {userNama}!
          </span>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '30px 40px', flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '8px' }}>
              Selamat Datang di Ruang Tenang
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
              Pilih waktu luangmu, pilih guru BK favoritmu. Konseling jadi lebih privat dan terjadwal.
            </p>
          </div>

          {/* Banner Quote */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '16px', fontStyle: 'italic', fontWeight: '600', color: '#1b3b2b' }}>
              “Perasaanmu valid. Tidak apa-apa untuk merasa lelah.”
            </p>
          </div>

          {/* Akses Cepat Button Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '35px' }}>
            <Link href="/booking" style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📅 Booking Konseling BK
            </Link>
            <Link href="/curhat" style={{ backgroundColor: '#ffffff', color: '#1b3b2b', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 Curhat Anonim
            </Link>
            <Link href="/jurnal" style={{ backgroundColor: '#ffffff', color: '#1b3b2b', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📖 Mulai Menulis Jurnal
            </Link>
            <Link href="/perizinan" style={{ backgroundColor: '#ffffff', color: '#1b3b2b', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📝 Ajukan Izin / Sakit
            </Link>
          </div>

          {/* Grid Fitur Utama */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b', margin: 0 }}>
              Fitur Utama Ruang Tenang
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            
            <Link href="/booking" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📅</span>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1b3b2b', fontWeight: 'bold' }}>Booking BK</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Pilih guru BK dan tentukan jadwal konseling tatap muka secara privat.</p>
              </div>
            </Link>

            <Link href="/curhat" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>💬</span>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1b3b2b', fontWeight: 'bold' }}>Curhat Anonim</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Bagikan ceritamu tanpa khawatir. Identitasmu aman dan terlindungi.</p>
              </div>
            </Link>

            <Link href="/jurnal" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📖</span>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1b3b2b', fontWeight: 'bold' }}>Jurnal Pribadi</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Tulis perasaanmu dan simpan sebagai catatan refleksi harian.</p>
              </div>
            </Link>

            <Link href="/perizinan" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📝</span>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1b3b2b', fontWeight: 'bold' }}>Perizinan Siswa</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Kirim surat izin atau sakit langsung ke Guru BK secara online.</p>
              </div>
            </Link>

            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📌</span>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1b3b2b', fontWeight: 'bold' }}>Afirmasi Harian</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Dapatkan motivasi positif harian untuk menjaga kesehatan mentalmu.</p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '16px 20px', textAlign: 'center', marginTop: 'auto' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>Ruang Tenang - Tempat Berbagi Cerita</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#a7f3d0' }}>Identitasmu aman. Semua curhat terlindungi.</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang. Made With Z-Solution</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>SMK BUDI BAKTI CIWIDEY</p>
        </footer>

      </div>
    </div>
  );
}