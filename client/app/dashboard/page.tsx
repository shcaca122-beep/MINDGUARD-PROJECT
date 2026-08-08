'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Sparkles, 
  Quote, 
  Calendar, 
  MessageSquareHeart, 
  BookOpen, 
  FileText, 
  HeartHandshake
} from 'lucide-react';

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      {/* DIPERBAIKI: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* Sidebar Navigasi */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Konten Utama Dashboard Siswa */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Topbar dengan Gradasi Premium */}
          <div style={{
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)',
            color: '#ffffff',
            padding: '18px 30px',
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={22} color="#34d399" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                Dashboard Ruang Tenang
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <Sparkles size={14} color="#34d399" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                Selamat Datang, <strong style={{ color: '#34d399' }}>{userNama}</strong>!
              </span>
            </div>
          </div>

          {/* Hero Section - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', width: '100%', boxSizing: 'border-box' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
                Selamat Datang di Ruang Tenang
              </h1>
              <p style={{ fontSize: '13px', color: '#a7f3d0', margin: 0, fontWeight: '500' }}>
                Pilih waktu luangmu, pilih guru BK favoritmu. Konseling jadi lebih privat dan terjadwal.
              </p>
            </div>

            {/* Banner Quote */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              <Quote size={18} color="#34d399" />
              <p style={{ margin: 0, fontSize: '16px', fontStyle: 'italic', fontWeight: '600', color: '#ecfdf5' }}>
                “Perasaanmu valid. Tidak apa-apa untuk merasa lelah.”
              </p>
            </div>

            {/* Akses Cepat Button Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '35px', width: '100%', boxSizing: 'border-box' }}>
              <Link href="/booking" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#fff', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}>
                <Calendar size={15} color="#a7f3d0" />
                <span>Booking Konseling BK</span>
              </Link>
              <Link href="/curhat" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquareHeart size={15} color="#34d399" />
                <span>Curhat Anonim</span>
              </Link>
              <Link href="/jurnal" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={15} color="#38bdf8" />
                <span>Mulai Menulis Jurnal</span>
              </Link>
              <Link href="/perizinan" style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', color: '#ffffff', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} color="#f87171" />
                <span>Ajukan Izin / Sakit</span>
              </Link>
            </div>

            {/* Grid Fitur Utama */}
            <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Fitur Utama Ruang Tenang
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              
              <Link href="/booking" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', height: '100%', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', marginBottom: '12px', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                    <Calendar size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Booking BK</h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>Pilih guru BK dan tentukan jadwal konseling tatap muka secara privat.</p>
                </div>
              </Link>

              <Link href="/curhat" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', height: '100%', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.2)', color: '#34d399', marginBottom: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    <MessageSquareHeart size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Curhat Anonim</h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>Bagikan ceritamu tanpa khawatir. Identitasmu aman dan terlindungi.</p>
                </div>
              </Link>

              <Link href="/jurnal" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', height: '100%', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', marginBottom: '12px', border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                    <BookOpen size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Jurnal Pribadi</h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>Tulis perasaanmu dan simpan sebagai catatan refleksi harian.</p>
                </div>
              </Link>

              <Link href="/perizinan" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', height: '100%', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.2)', color: '#f87171', marginBottom: '12px', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                    <FileText size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Perizinan Siswa</h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>Kirim surat izin atau sakit langsung ke Guru BK secara online.</p>
                </div>
              </Link>

              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', height: '100%', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.2)', color: '#fcd34d', marginBottom: '12px', border: '1px solid rgba(252, 211, 77, 0.3)' }}>
                  <HeartHandshake size={24} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Afirmasi Harian</h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>Dapatkan motivasi positif harian untuk menjaga kesehatan mentalmu.</p>
              </div>

            </div>
          </div>

          {/* Footer */}
          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '20px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#34d399' }}>Ruang Tenang - Tempat Berbagi Cerita</p>
            <p style={{ margin: '0 0 6px 0', fontSize: '11.5px', color: '#a7f3d0' }}>Identitasmu aman. Semua curhat terlindungi.</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '11.5px', color: '#a7f3d0', opacity: 0.8 }}>&copy; 2026 Ruang Tenang. Made With Z-Solution</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.05em' }}>SMK BUDI BAKTI CIWIDEY</p>
          </footer>

        </div>
      </div>
    </>
  );
}