'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { FileText, Calendar, RefreshCw, Send, Sparkles, ClipboardList } from 'lucide-react';

export default function PerizinanPage() {
  const today = new Date().toISOString().split('T')[0];

  const [tabKategori, setTabKategori] = useState<'sakit' | 'izin'>('sakit');
  const [subSakit, setSubSakit] = useState('Sakit Tidak Masuk Sekolah (Dari Rumah)');
  const [subIzin, setSubIzin] = useState('Izin Keluar Sekolah (Ada Keperluan)');

  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);

  const [waktu, setWaktu] = useState('');
  const [alasan, setAlasan] = useState('');
  
  const [lampiranBase64, setLampiranBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [listIzin, setListIzin] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        alert('Ukuran file foto terlalu besar! Maksimal 3 MB.');
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
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR GRADASI */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
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
              <FileText size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                Pengajuan Surat Izin & Sakit Siswa
              </h2>
              <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Sistem perizinan digital resmi sekolah[cite: 11]</span>
            </div>
          </div>

          {/* CONTENT UTAMA - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {statusMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', fontSize: '13.5px', backgroundColor: statusMsg.type === 'success' ? '#064e3b' : '#7f1d1d', color: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#f87171'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box' }}>
                {statusMsg.type === 'success' ? '✅ ' : '⚠️ '} {statusMsg.message}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
              
              {/* FORMULIR PERIZINAN */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#021f18', padding: '6px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setTabKategori('sakit')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: tabKategori === 'sakit' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
                      color: tabKategori === 'sakit' ? '#ffffff' : '#94a3b8',
                      boxShadow: tabKategori === 'sakit' ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none'
                    }}
                  >
                    Surat Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabKategori('izin')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: tabKategori === 'izin' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
                      color: tabKategori === 'izin' ? '#ffffff' : '#94a3b8',
                      boxShadow: tabKategori === 'izin' ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none'
                    }}
                  >
                    Surat Izin
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {tabKategori === 'sakit' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Kategori Sakit
                      </label>
                      <select
                        value={subSakit}
                        onChange={(e) => setSubSakit(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="Sakit Tidak Masuk Sekolah (Dari Rumah)">Sakit Tidak Masuk Sekolah (Dari Rumah)</option>
                        <option value="Sakit Saat KBM (Minta Pulang Awal / UKS)">Sakit Saat KBM (Minta Pulang Awal / UKS)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Kategori Surat Izin
                      </label>
                      <select
                        value={subIzin}
                        onChange={(e) => setSubIzin(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="Izin Keluar Sekolah (Ada Keperluan)">Izin Keluar Sekolah (Ada Keperluan)</option>
                        <option value="Izin Tidak Masuk Sekolah (Urusan Keluarga)">Izin Tidak Masuk Sekolah (Urusan Keluarga)</option>
                        <option value="Dispensasi Kegiatan Sekolah / OSIS">Dispensasi Kegiatan Sekolah / OSIS</option>
                      </select>
                    </div>
                  )}

                  {needsDateRange ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#021f18', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                          Tanggal Mulai
                        </label>
                        <input
                          type="date"
                          required
                          value={tglMulai}
                          onChange={(e) => setTglMulai(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12.5px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                          Sampai Tanggal
                        </label>
                        <input
                          type="date"
                          required
                          value={tglSelesai}
                          onChange={(e) => setTglSelesai(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12.5px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Jam / Waktu Meninggalkan Sekolah
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Jam 09:30 WIB (Jam Ke-3) / S/d Jam 12:00 WIB"
                        value={waktu}
                        onChange={(e) => setWaktu(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                      />
                      <span style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '4px', display: 'block' }}>
                        *Berlaku untuk hari ini ({today})[cite: 11]
                      </span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Alasan / Keterangan Lengkap
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tuliskan alasan perizinan atau kondisi sakit secara jelas..."
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#021f18', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Lampirkan Foto Surat Dokter / Orang Tua (Opsional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ fontSize: '12px', color: '#a7f3d0', width: '100%', cursor: 'pointer' }}
                    />
                    {fileName && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#34d399', fontWeight: '700' }}>
                        File Terpilih: {fileName}[cite: 11]
                      </div>
                    )}
                    {lampiranBase64 && (
                      <img
                        src={lampiranBase64}
                        alt="Preview Lampiran"
                        style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}
                      />
                    )}
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
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isLoading ? 'Mengirim...' : tabKategori === 'sakit' ? 'Kirim Surat Sakit' : 'Kirim Surat Izin'}</span>
                  </button>
                </form>
              </div>

              {/* STATUS RIWAYAT PERIZINAN */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>Status Perizinan Anda</h3>
                  <button onClick={fetchPerizinan} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff' }}>
                    <RefreshCw size={12} color="#34d399" />
                    <span>Refresh</span>
                  </button>
                </div>

                {listIzin.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', margin: '30px 0' }}>Belum ada pengajuan izin/sakit yang dikirim.[cite: 11]</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                    {listIzin.map((item) => {
                      const isSakit = item.jenis_izin?.includes('[SAKIT]');
                      return (
                        <div key={item.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#021f18', borderLeft: `4px solid ${isSakit ? '#34d399' : '#60a5fa'}`, border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#f8fafc' }}>
                            {item.jenis_izin}
                          </div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                            <strong style={{ color: '#fff' }}>Alasan:</strong> {item.alasan}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} />
                            <span>Waktu: {item.tanggal} ({item.jam_mulai})[cite: 11]</span>
                          </div>

                          {item.lampiran_url && (
                            <div style={{ marginTop: '8px' }}>
                              <a href={item.lampiran_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={item.lampiran_url}
                                  alt="Lampiran Surat"
                                  style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)', cursor: 'pointer' }}
                                />
                              </a>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Klik foto untuk memperbesar[cite: 11]</div>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}[cite: 11]</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', backgroundColor: item.status === 'DISETUJUI PIKET' || item.status === 'DISETUJUI' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(217, 119, 6, 0.2)', color: item.status === 'DISETUJUI PIKET' || item.status === 'DISETUJUI' ? '#34d399' : '#fcd34d', border: item.status === 'DISETUJUI PIKET' || item.status === 'DISETUJUI' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(252, 211, 77, 0.3)' }}>
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

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey[cite: 11]
          </footer>

        </div>
      </div>
    </>
  );
}