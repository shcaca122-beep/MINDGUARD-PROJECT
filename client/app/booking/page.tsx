'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function BookingPage() {
  const [tanggal, setTanggal] = useState('');
  const [sesi, setSesi] = useState('08:00 - 09:00 WIB (Sesi 1)');
  const [konselor, setKonselor] = useState('Guru BK');
  const [topik, setTopik] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const sessionData = localStorage.getItem('user_session');
      const session = sessionData ? JSON.parse(sessionData) : {};

      const { error } = await supabase.from('layanan_siswa').insert([
        {
          nama_siswa: session.nama || session.email || 'Siswa',
          kelas: session.kelas || '-',
          layanan: 'KONSELING',
          tanggal: `${tanggal} (${sesi})`,
          tujuan_konselor: konselor,
          judul_pesan: topik,
          topik: deskripsi || topik,
          status: 'MENUNGGU ACC',
        },
      ]);

      if (error) throw error;

      setStatus({
        type: 'success',
        message: 'Jadwal konseling berhasil diajukan! Guru BK akan memproses permohonan Anda.',
      });
      setTanggal('');
      setTopik('');
      setDeskripsi('');
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim pengajuan. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR SERAGAM (PUTIH) */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📅</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
            Booking Jadwal Konseling BK
          </h2>
        </div>

        {/* CONTENT UTAMA */}
        <div style={{ padding: '30px 40px', flex: 1 }}>
          
          {/* BANNER HIJAU TUA HEADER */}
          <div
            style={{
              backgroundColor: '#1b3b2b',
              color: '#ffffff',
              padding: '20px 24px',
              borderRadius: '12px',
              marginBottom: '25px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>📅 Booking Jadwal Konseling BK</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a7f3d0' }}>
              Ajukan sesi konseling tatap muka secara terencana, privat, dan nyaman bersama Guru Bimbingan Konseling.
            </p>
          </div>

          {/* ALERT STATUS */}
          {status && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13.5px',
                fontWeight: 'bold',
                backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: status.type === 'success' ? '#15803d' : '#991b1b',
                border: `1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`,
              }}
            >
              {status.type === 'success' ? '✅ ' : '⚠️ '} {status.message}
            </div>
          )}

          {/* GRID 2 KOLOM */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px', alignItems: 'start' }}>
            
            {/* FORMULIR KIRI */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#1b3b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📝 Form Permohonan Sesi
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Layanan / Konselor Tujuan
                  </label>
                  <select
                    value={konselor}
                    onChange={(e) => setKonselor(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                  >
                    <option value="Guru BK">Guru BK (Bimbingan Konseling Sekolah)</option>
                    <option value="Peer Counselor OSIS">Peer Counselor (Konselor Sebaya OSIS/MPK)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                      Tanggal Sesi
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                      Pilihan Sesi Jam
                    </label>
                    <select
                      value={sesi}
                      onChange={(e) => setSesi(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}
                    >
                      <option value="08:00 - 09:00 WIB (Sesi 1)">Sesi 1 (08.00 - 09.00)</option>
                      <option value="10:00 - 11:00 WIB (Sesi 2)">Sesi 2 (10.00 - 11.00)</option>
                      <option value="13:00 - 14:00 WIB (Sesi 3)">Sesi 3 (13.00 - 14.00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Topik Utama Konseling
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hambatan Belajar / Karir / Masalah Pribadi"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan gambaran singkat hal yang ingin dibahas agar Guru BK dapat mempersiapkan sesi dengan lebih optimal..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#1b3b2b',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {isLoading ? '⌛ Memproses...' : '📩 Kirim Permohonan Konseling'}
                </button>
              </form>
            </div>

            {/* KARTU KANAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🛡️</span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', color: '#1b3b2b' }}>Kerahasiaan Dijamin</h4>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                  Seluruh identitas, topik, dan pembahasan selama sesi konseling bersifat <strong>100% rahasia</strong> antara Anda dan Guru BK sesuai asas kerahasiaan Bimbingan Konseling.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '22px' }}>📌</span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', color: '#1b3b2b' }}>Tahapan Setelah Pengajuan</h4>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#475569', lineHeight: '1.7' }}>
                  <li>Pengajuan Anda terdata di sistem Guru BK.</li>
                  <li>Guru BK melakukan verifikasi jadwal.</li>
                  <li>Anda dapat mendatangi Ruang BK sesuai waktu yang telah disetujui.</li>
                </ol>
              </div>

              <div style={{ backgroundColor: '#e0f2fe', padding: '16px 18px', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🏢</span>
                <div>
                  <h5 style={{ margin: 0, fontSize: '13px', color: '#0369a1', fontWeight: 'bold' }}>Lokasi Ruang Bimbingan Konseling</h5>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#0284c7' }}>
                    Gedung Utama Lt. 1, SMK Budi Bakti Ciwidey
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '12px', textAlign: 'center', fontSize: '11px' }}>
          &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
        </footer>

      </div>
    </div>
  );
}