'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function CurhatPage() {
  // 1. STATE INPUT FORM
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [tujuan, setTujuan] = useState<'Guru BK' | 'Peer Konseling'>('Peer Konseling');
  const [isAnonim, setIsAnonim] = useState(false);

  // 2. STATE LOADING & MODAL POPUP
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 3. HANDLER SUBMIT CURHAT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Otomatis tentukan nama & kelas jika centang 'Anonim' diaktifkan
    const namaSiswaFinal = isAnonim || !nama.trim() ? 'Anonim' : nama;
    const kelasFinal = isAnonim || !kelas.trim() ? '-' : kelas;

    try {
      const { error } = await supabase
        .from('layanan_siswa')
        .insert([
          {
            layanan: 'CURHAT',
            nama_siswa: namaSiswaFinal,
            kelas: kelasFinal,
            judul_pesan: judul,
            pesan: pesan,
            topik: `[Tujuan: ${tujuan}] - ${pesan}`, // Menyimpan ringkasan agar kompatibel di tabel
            tujuan_konselor: tujuan,
            status: 'Perlu Respon',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        alert('Gagal mengirim curhat: ' + error.message);
      } else {
        setShowSuccessModal(true);
        // Reset Form setelah berhasil
        setNama('');
        setKelas('');
        setJudul('');
        setPesan('');
        setIsAnonim(false);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', backgroundColor: '#d1f2d9' }}>
      
      {/* 🟢 SIDEBAR NAVIGASI PERMANEN */}
      <Sidebar />

      {/* ⚪ KONTEN UTAMA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1b3b2b', fontWeight: 'bold' }}>
            💬 Layanan Curhat Siswa
          </h2>
        </div>

        {/* BODY CONTENT */}
        <div style={{ flex: 1, padding: '30px 20px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#1b3b2b', fontSize: '18px', fontWeight: 'bold' }}>
              Sampaikan Keluh Kesahmu dengan Aman 🔒
            </h3>
            <p style={{ fontSize: '13px', color: '#4b5563', marginTop: 0, marginBottom: '20px' }}>
              Kamu bisa memilih untuk mengirimkan cerita ini secara anonim (tanpa nama & kelas).
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* PILIHAN ANONIM */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #b5d8b6', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="checkboxAnonim"
                  checked={isAnonim}
                  onChange={(e) => setIsAnonim(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1b3b2b' }}
                />
                <label htmlFor="checkboxAnonim" style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', color: '#1b3b2b' }}>
                  🔒 Kirim Secara Anonim (Sembunyikan Nama & Kelas)
                </label>
              </div>

              {/* INPUT NAMA & KELAS (DISEMBUNYIKAN JIKA ANONIM) */}
              {!isAnonim && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>Kelas</label>
                    <input
                      type="text"
                      placeholder="Contoh: X RPL 1"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* TUJUAN KONSELOR */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>Tujuan Curhat / Konselor</label>
                <select
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}
                >
                  <option value="Peer Konseling">🪷 Peer Counselor / Pengurus OSIS</option>
                  <option value="Guru BK">🧠 Guru BK (Bimbingan Konseling)</option>
                </select>
              </div>

              {/* JUDUL PESAN */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>Judul Pesan</label>
                <input
                  type="text"
                  required
                  placeholder="Sebutkan topik singkat curhatanmu..."
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* ISI CURHATAN */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>Isi Curhatan</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Ceritakan masalah atau perasaanmu secara detail di sini..."
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* TOMBOL SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                style={{ width: '100%', backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '14px', marginTop: '6px' }}
              >
                {isLoading ? '⏳ Memproses Pengiriman...' : '🚀 Kirim Curhatan'}
              </button>
            </form>
          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', textAlign: 'center', padding: '15px', marginTop: 'auto' }}>
          <p style={{ margin: '0', fontSize: '11px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey</p>
        </footer>

      </div>

      {/* MODAL BERHASIL TERKIRIM */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '20px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1b3b2b' }}>Curhat Berhasil Terkirim!</h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5', marginBottom: '20px' }}>
              Pesan kamu sudah diteruskan ke <strong>{tujuan}</strong>. Terima kasih telah berani bercerita!
            </p>
            <button
              onClick={handleCloseModal}
              style={{ backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}