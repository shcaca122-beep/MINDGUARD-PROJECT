'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/lib/swal';

export default function FormPerizinanPage() {
  // 1. STATE INPUT FORM
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('X BRP 1');
  const [formData, setFormData] = useState({
    jenis: 'Sakit',
    tanggalMulai: '',
    alasan: ''
  });

  // 2. STATE LOADING & DATA RIWAYAT
  const [isLoading, setIsLoading] = useState(false);
  const [riwayatIzin, setRiwayatIzin] = useState<any[]>([]);

  // 🔄 FETCH DATA PERIZINAN DARI DATABASE
  const fetchPerizinan = async () => {
    try {
      const { data, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'PERIZINAN')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRiwayatIzin(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data perizinan:', err);
    }
  };

  useEffect(() => {
    fetchPerizinan();
  }, []);

  // 💾 HANDLER SUBMIT SURAT IZIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('layanan_siswa')
        .insert([
          {
            layanan: 'PERIZINAN',
            nama_siswa: namaSiswa.trim() || 'Siswa',
            kelas: kelas,
            judul_pesan: `Perizinan ${formData.jenis}`,
            topik: `[Jenis: ${formData.jenis}] - ${formData.alasan}`,
            tanggal: formData.tanggalMulai,
            status: 'MENUNGGU ACC',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // Pop-up profesional SweetAlert2
      showSuccess('Pengajuan Berhasil!', 'Surat izin kamu telah berhasil dikirim ke Guru BK.');

      // Reset Form & Refresh Data
      setFormData({ jenis: 'Sakit', tanggalMulai: '', alasan: '' });
      fetchPerizinan();
    } catch (err: any) {
      alert('❌ Gagal mengirim pengajuan izin: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsLoading(false);
    }
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
            📝 Pengajuan Surat Izin / Sakit
          </h2>
        </div>

        {/* BODY CONTENT */}
        <div style={{ flex: 1, padding: '30px 20px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* FORM CONTAINER */}
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2f0e3', paddingBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>📝</span>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b', margin: 0 }}>Ajukan Surat Izin / Sakit</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* INPUT NAMA & KELAS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Nama Siswa</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Masukkan Nama Lengkap"
                    value={namaSiswa}
                    onChange={(e) => setNamaSiswa(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Kelas</label>
                  <select 
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                  >
                    <option value="X BRP 1">X BRP 1</option>
                    <option value="X BRP 2">X BRP 2</option>
                    <option value="XI AKL 1">XI AKL 1</option>
                    <option value="XI MPLB 1">XI MPLB 1</option>
                    <option value="XII MPLB 1">XII MPLB 1</option>
                  </select>
                </div>
              </div>

              {/* JENIS PERIZINAN & TANGGAL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Jenis Perizinan</label>
                  <select 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                    value={formData.jenis}
                    onChange={(e) => setFormData({...formData, jenis: e.target.value})}
                  >
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Mulai Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.tanggalMulai}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
                  />
                </div>
              </div>

              {/* ALASAN / KETERANGAN */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Alasan / Keterangan</label>
                <textarea 
                  required 
                  rows={4}
                  value={formData.alasan}
                  placeholder="Tuliskan alasan izin/sakit secara detail..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  onChange={(e) => setFormData({...formData, alasan: e.target.value})}
                ></textarea>
              </div>

              {/* UPLOAD BUKTI (OPSIONAL) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#1b3b2b' }}>Upload Bukti Surat (Opsional)</label>
                <input type="file" style={{ fontSize: '12px', color: '#4b5563' }} />
              </div>

              {/* TOMBOL SUBMIT */}
              <button 
                type="submit" 
                disabled={isLoading}
                style={{ backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '6px' }}
              >
                {isLoading ? '⏳ Memproses Pengajuan...' : 'Kirim Pengajuan 🚀'}
              </button>
            </form>
          </div>

          {/* TABEL STATUS PERIZINAN */}
          <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '18px', fontWeight: 'bold' }}>
            📋 Riwayat Pengajuan Izin
          </h3>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1b3b2b', color: '#ffffff' }}>
                  <th style={{ padding: '10px' }}>Siswa</th>
                  <th style={{ padding: '10px' }}>Tanggal</th>
                  <th style={{ padding: '10px' }}>Detail Alasan</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayatIzin.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
                      Belum ada permohonan surat izin.
                    </td>
                  </tr>
                ) : (
                  riwayatIzin.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama_siswa} ({item.kelas})</td>
                      <td style={{ padding: '10px' }}>{item.tanggal || '-'}</td>
                      <td style={{ padding: '10px' }}>{item.topik || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                          {item.status || 'MENUNGGU ACC'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', textAlign: 'center', padding: '15px', marginTop: 'auto' }}>
          <p style={{ margin: '0', fontSize: '11px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey</p>
        </footer>

      </div>

    </div>
  );
}