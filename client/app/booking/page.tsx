'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Calendar, ShieldCheck, Sparkles, Send, Building2, HelpCircle } from 'lucide-react';

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
          
          {/* TOP BAR */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '16px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: 'rgba(52, 211, 153, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                Booking Jadwal Konseling BK
              </h2>
              <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Sistem Reservasi Sesi Bimbingan Personal Siswa</span>
            </div>
          </div>

          {/* CONTENT UTAMA */}
          <div style={{ padding: '30px 40px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* BANNER HEADER */}
            <div
              style={{
                backgroundColor: 'rgba(2, 31, 24, 0.85)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '25px',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={18} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ecfdf5' }}>Booking Jadwal Konseling BK</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0' }}>
                Ajukan sesi konseling tatap muka secara terencana, privat, dan nyaman bersama Guru Bimbingan Konseling.
              </p>
            </div>

            {/* ALERT STATUS */}
            {status && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  backgroundColor: status.type === 'success' ? '#064e3b' : '#7f1d1d',
                  color: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${status.type === 'success' ? '#10b981' : '#f87171'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {status.type === 'success' ? '✅ ' : '⚠️ '} {status.message}
              </div>
            )}

            {/* GRID 2 KOLOM */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start' }}>
              
              {/* FORMULIR KIRI */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📝 Form Permohonan Sesi
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Layanan / Konselor Tujuan
                    </label>
                    <select
                      value={konselor}
                      onChange={(e) => setKonselor(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                    >
                      <option value="Guru BK">Guru BK (Bimbingan Konseling Sekolah)</option>
                      <option value="Peer Counselor OSIS">Peer Counselor (Konselor Sebaya OSIS/MPK)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Tanggal Sesi
                      </label>
                      <input
                        type="date"
                        required
                        min={today}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Pilihan Sesi Jam
                      </label>
                      <select
                        value={sesi}
                        onChange={(e) => setSesi(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12.5px', boxSizing: 'border-box', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                      >
                        <option value="08:00 - 09:00 WIB (Sesi 1)">Sesi 1 (08.00 - 09.00)</option>
                        <option value="10:00 - 11:00 WIB (Sesi 2)">Sesi 2 (10.00 - 11.00)</option>
                        <option value="13:00 - 14:00 WIB (Sesi 3)">Sesi 3 (13.00 - 14.00)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Topik Utama Konseling
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Hambatan Belajar / Karir / Masalah Pribadi"
                      value={topik}
                      onChange={(e) => setTopik(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tuliskan gambaran singkat hal yang ingin dibahas agar Guru BK dapat mempersiapkan sesi dengan lebih optimal..."
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isLoading ? '⌛ Memproses...' : 'Kirim Permohonan Konseling'}</span>
                  </button>
                </form>
              </div>

              {/* KARTU KANAN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <ShieldCheck size={20} color="#34d399" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Kerahasiaan Dijamin</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    Seluruh identitas, topik, dan pembahasan selama sesi konseling bersifat <strong>100% rahasia</strong> antara Anda dan Guru BK sesuai asas kerahasiaan Bimbingan Konseling.
                  </p>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <HelpCircle size={20} color="#34d399" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Tahapan Setelah Pengajuan</h4>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                    <li>Pengajuan Anda terdata di sistem Guru BK.</li>
                    <li>Guru BK melakukan verifikasi jadwal.</li>
                    <li>Anda dapat mendatangi Ruang BK sesuai waktu yang telah disetujui.</li>
                  </ol>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <Building2 size={24} color="#34d399" />
                  <div>
                    <h5 style={{ margin: 0, fontSize: '13px', color: '#34d399', fontWeight: '700' }}>Lokasi Ruang Bimbingan Konseling</h5>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#a7f3d0' }}>
                      Gedung Utama Lt. 1, SMK Budi Bakti Ciwidey
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* FOOTER */}
          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '14px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)' }}>
            &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}