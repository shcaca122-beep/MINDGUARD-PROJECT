'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function BKPerizinanPage() {
  const [listIzin, setListIzin] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  // State untuk Pop-up / Modal Foto
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchPerizinan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perizinan_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListIzin(data || []);
    } catch (err) {
      console.error('Error fetching perizinan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerizinan();
  }, []);

  // Update Status Perizinan oleh BK
  const handleUpdateStatus = async (id: string, statusBaru: string) => {
    try {
      const { error } = await supabase
        .from('perizinan_siswa')
        .update({ status: statusBaru })
        .eq('id', id);

      if (error) throw error;
      fetchPerizinan();
    } catch (err: any) {
      alert('Gagal mengupdate status: ' + err.message);
    }
  };

  const filteredData = listIzin.filter(
    (item) =>
      item.nama_siswa?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.jenis_izin?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
              Panel Guru BK - Rekap Perizinan & Sakit Siswa
            </h2>
          </div>
          <button onClick={fetchPerizinan} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔄 Refresh Data
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '25px 30px', flex: 1 }}>
          
          {/* SEARCH BAR */}
          <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <input
              type="text"
              placeholder="🔍 Cari Nama Siswa, Kelas, atau Jenis Izin..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
            />
          </div>

          {/* LIST PERIZINAN */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#475569', marginTop: '40px' }}>⌛ Memuat data perizinan...</p>
          ) : filteredData.length === 0 ? (
            <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '10px', textAlign: 'center', color: '#64748b' }}>
              Belum ada data pengajuan perizinan siswa.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {filteredData.map((item) => {
                const isSakit = item.jenis_izin?.includes('[SAKIT]');
                return (
                  <div key={item.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <div>
                      {/* HEADER CARD */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '15px', color: '#1b3b2b', fontWeight: 'bold' }}>
                            {item.nama_siswa || 'Siswa N/A'}
                          </h3>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                            Kelas: {item.kelas || '-'}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', backgroundColor: isSakit ? '#fee2e2' : '#e0f2fe', color: isSakit ? '#991b1b' : '#0369a1' }}>
                          {isSakit ? '🤒 SAKIT' : '🚗 IZIN'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '8px', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                        <strong>Kategori:</strong> {item.jenis_izin}
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                        <strong>📅 Waktu/Tanggal:</strong> {item.tanggal} {item.jam_mulai ? `(${item.jam_mulai})` : ''}
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                        <strong>📝 Alasan:</strong> {item.alasan}
                      </div>

                      {/* LAMPIRAN FOTO DARI SISWA */}
                      <div style={{ marginBottom: '14px', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                          📎 Lampiran Surat / Foto Bukti:
                        </div>
                        {item.lampiran_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={item.lampiran_url}
                              alt="Surat Lampiran"
                              onClick={() => setSelectedImage(item.lampiran_url)}
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImage(item.lampiran_url)}
                              style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              🔍 Perbesar Foto
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada lampiran foto/surat.</span>
                        )}
                      </div>
                    </div>

                    {/* STATUS & ACTION BUTTONS */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Status Saat Ini:</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: item.status?.includes('DISETUJUI') ? '#dcfce7' : item.status === 'DITOLAK' ? '#fee2e2' : '#fef3c7', color: item.status?.includes('DISETUJUI') ? '#15803d' : item.status === 'DITOLAK' ? '#991b1b' : '#92400e' }}>
                          {item.status || 'MENUNGGU ACC'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'DISETUJUI BK')}
                          style={{ flex: 1, backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✓ Setujui (BK)
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'DITOLAK BK')}
                          style={{ flex: 1, backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* MODAL POP-UP UNTUK MEMPERBESAR FOTO */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '-15px', right: '-15px', backgroundColor: '#dc2626', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Lampiran Surat Full"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      )}

    </div>
  );
}