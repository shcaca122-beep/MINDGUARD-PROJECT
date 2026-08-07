'use client';

import Sidebar from '@/components/Sidebar';

export default function PanggilanOrtuBKPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '30px' }}>
        <h2 style={{ color: '#1b3b2b', margin: '0 0 20px 0' }}>📞 Surat & Log Panggilan Orang Tua</h2>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <p style={{ color: '#475569', fontSize: '14px' }}>Penerbitan surat panggilan resmi orang tua siswa untuk konsultasi tindak lanjut Bimbingan Konseling.</p>
          <button style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            📑 Buat Surat Panggilan Ortu
          </button>
        </div>
      </div>
    </div>
  );
}