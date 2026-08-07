'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function PerizinanPage() {
  const today = new Date().toISOString().split('T')[0];

  // Tab Utama
  const [tabKategori, setTabKategori] = useState<'sakit' | 'izin'>('sakit');
  
  // Sub Kategori Sakit
  const [subSakit, setSubSakit] = useState('Sakit Tidak Masuk Sekolah (Dari Rumah)');
  
  // Sub Kategori Izin
  const [subIzin, setSubIzin] = useState('Izin Keluar Sekolah (Ada Keperluan)');

  // Input Tanggal (Untuk yang butuh hari/hari libur)
  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);

  // Input Jam / Waktu
  const [waktu, setWaktu] = useState('');
  const [alasan, setAlasan] = useState('');
  
  // State Lampiran Foto
  const [lampiranBase64, setLampiranBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [listIzin, setListIzin] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // CEK APAKAH KATEGORI INI BUTUH RENTANG TANGGAL ATAU CUKUP JAM
  const needsDateRange = 
    (tabKategori === 'sakit' && subSakit.includes('Dari Rumah')) ||
    (tabKategori === 'izin' && subIzin.includes('Urusan Keluarga')) ||
    (tabKategori === 'izin' && subIzin.includes('Dispensasi'));

  const fetchPerizinan = async () => {
    try {
      const sessionData = localStorage.getItem('user_session');
      const session = sessionData ? JSON.parse(sessionData) : {};
      const namaSiswa = session.nama || session.email;

      let query = supabase.from('perizinan_siswa').select('*').order('created_at', { ascending: false });

      if (namaSiswa) {
        query = query.ilike('nama_siswa', `%${namaSiswa}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setListIzin(data);
      }
    } catch (err) {
      console.error('Error fetching perizinan:', err);
    }
  };

  useEffect(() => {
    fetchPerizinan();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('⚠️ Ukuran file foto terlalu besar! Maksimal 3 MB.');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLampiranBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const sessionData = localStorage.getItem('user_session');
      const session = sessionData ? JSON.parse(sessionData) : {};

      const subKategoriAktif = tabKategori === 'sakit' ? subSakit : subIzin;
      const jenisFinal = `[${tabKategori.toUpperCase()}] ${subKategoriAktif}`;

      // Penentuan format tanggal & jam
      const tanggalDisplay = needsDateRange
        ? (tglMulai === tglSelesai ? tglMulai : `${tglMulai} s/d ${tglSelesai}`)
        : today;

      const payload = {
        nama_siswa: session.nama || session.email || 'Siswa',
        kelas: session.kelas || 'X',
        jenis_izin: jenisFinal,
        alasan: alasan,
        jam_mulai: waktu || (needsDateRange ? 'Seharian' : 'Jam KBM'),
        tanggal: tanggalDisplay,
        tanggal_mulai: needsDateRange ? tglMulai : today,
        tanggal_selesai: needsDateRange ? tglSelesai : today,
        lampiran_url: lampiranBase64 || null,
        status: 'MENUNGGU ACC PIKET',
      };

      const { error } = await supabase.from('perizinan_siswa').insert([payload]);

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        message: `Pengajuan ${tabKategori === 'sakit' ? 'Surat Sakit' : 'Surat Izin'} berhasil dikirim!`,
      });

      setAlasan('');
      setWaktu('');
      setLampiranBase64('');
      setFileName('');
      fetchPerizinan();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        message: err.message || 'Gagal mengirim pengajuan perizinan.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📝</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
            Pengajuan Surat Izin & Sakit Siswa
          </h2>
        </div>

        {/* CONTENT UTAMA */}
        <div style={{ padding: '30px 40px', flex: 1 }}>
          
          {/* NOTIFIKASI */}
          {statusMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '13px', backgroundColor: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMsg.type === 'success' ? '#15803d' : '#991b1b', border: `1px solid ${statusMsg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
              {statusMsg.type === 'success' ? '✅ ' : '⚠️ '} {statusMsg.message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px', alignItems: 'start' }}>
            
            {/* FORMULIR PERIZINAN */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              
              {/* TAB PILIHAN (SAKIT vs IZIN) */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTabKategori('sakit')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: tabKategori === 'sakit' ? '#dc2626' : 'transparent',
                    color: tabKategori === 'sakit' ? '#ffffff' : '#64748b',
                  }}
                >
                  🤒 Surat Sakit
                </button>
                <button
                  type="button"
                  onClick={() => setTabKategori('izin')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    backgroundColor: tabKategori === 'izin' ? '#1b3b2b' : 'transparent',
                    color: tabKategori === 'izin' ? '#ffffff' : '#64748b',
                  }}
                >
                  🚗 Surat Izin
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* PILIHAN KATEGORI DROP DOWN */}
                {tabKategori === 'sakit' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#991b1b', marginBottom: '6px' }}>
                      Kategori Sakit
                    </label>
                    <select
                      value={subSakit}
                      onChange={(e) => setSubSakit(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                    >
                      <option value="Sakit Tidak Masuk Sekolah (Dari Rumah)">🤒 Sakit Tidak Masuk Sekolah (Dari Rumah)</option>
                      <option value="Sakit Saat KBM (Minta Pulang Awal / UKS)">🏥 Sakit Saat KBM (Minta Pulang Awal / UKS)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                      Kategori Surat Izin
                    </label>
                    <select
                      value={subIzin}
                      onChange={(e) => setSubIzin(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                    >
                      <option value="Izin Keluar Sekolah (Ada Keperluan)">🚗 Izin Keluar Sekolah (Ada Keperluan)</option>
                      <option value="Izin Tidak Masuk Sekolah (Urusan Keluarga)">🏠 Izin Tidak Masuk Sekolah (Urusan Keluarga)</option>
                      <option value="Dispensasi Kegiatan Sekolah / OSIS">🏅 Dispensasi Kegiatan Sekolah / OSIS</option>
                    </select>
                  </div>
                )}

                {/* TAMPILKAN INPUT TANGGAL HANYA JIKA DIPERLUKAN (TIDAK MASUK / DISPENSASI) */}
                {needsDateRange ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                        📅 Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        required
                        value={tglMulai}
                        onChange={(e) => setTglMulai(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                        📅 Sampai Tanggal
                      </label>
                      <input
                        type="date"
                        required
                        value={tglSelesai}
                        onChange={(e) => setTglSelesai(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  /* JIKA HANYA IZIN KELUAR / SAKIT SAAT KBM: TAMPILKAN INPUT JAM & INFO HARI INI */
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                      ⏰ Jam / Waktu Meninggalkan Sekolah
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Jam 09:30 WIB (Jam Ke-3) / S/d Jam 12:00 WIB"
                      value={waktu}
                      onChange={(e) => setWaktu(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      *Berlaku untuk hari ini ({today})
                    </span>
                  </div>
                )}

                {/* ALASAN LENGKAP */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Alasan / Keterangan Lengkap
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan alasan perizinan atau kondisi sakit secara jelas..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                {/* UPLOAD LAMPIRAN FOTO / SURAT */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    📎 Lampirkan Foto Surat Dokter / Orang Tua (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ fontSize: '12px', color: '#475569', width: '100%' }}
                  />
                  {fileName && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                      ✓ File Terpilih: {fileName}
                    </div>
                  )}
                  {lampiranBase64 && (
                    <img
                      src={lampiranBase64}
                      alt="Preview Lampiran"
                      style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: tabKategori === 'sakit' ? '#dc2626' : '#1b3b2b',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? '⌛ Mengirim...' : tabKategori === 'sakit' ? '📩 Kirim Surat Sakit' : '📩 Kirim Surat Izin'}
                </button>
              </form>
            </div>

            {/* STATUS RIWAYAT PERIZINAN */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1b3b2b' }}>📋 Status Perizinan Anda</h3>
                <button onClick={fetchPerizinan} style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
              </div>

              {listIzin.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '30px 0' }}>Belum ada pengajuan izin/sakit yang dikirim.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {listIzin.map((item) => {
                    const isSakit = item.jenis_izin?.includes('[SAKIT]');
                    return (
                      <div key={item.id} style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f8fafc', borderLeft: `4px solid ${isSakit ? '#dc2626' : '#1b3b2b'}`, borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: isSakit ? '#991b1b' : '#1b3b2b' }}>
                          {item.jenis_izin}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                          <strong>Alasan:</strong> {item.alasan}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '2px', fontWeight: 'bold' }}>
                          📅 Waktu: {item.tanggal} ({item.jam_mulai})
                        </div>

                        {item.lampiran_url && (
                          <div style={{ marginTop: '8px' }}>
                            <a href={item.lampiran_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={item.lampiran_url}
                                alt="Lampiran Surat"
                                style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              />
                            </a>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>Klik foto untuk memperbesar</div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: item.status === 'DISETUJUI PIKET' || item.status === 'DISETUJUI' ? '#dcfce7' : '#fef3c7', color: item.status === 'DISETUJUI PIKET' || item.status === 'DISETUJUI' ? '#15803d' : '#92400e' }}>
                            {item.status || 'MENUNGGU ACC'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '12px', textAlign: 'center', fontSize: '11px' }}>
          &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
        </footer>

      </div>
    </div>
  );
}