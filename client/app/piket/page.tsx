'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, ClipboardList, CheckCircle2, XCircle, Search, Inbox, Paperclip } from 'lucide-react';

export default function PiketPage() {
  const [listIzin, setListIzin] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  // State Modal Pop-up Foto
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Ambil Data Perizinan dari Supabase
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

  // Update Status Perizinan (ACC / TOLAK)
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

        {/* Konten Utama Piket */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR */}
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
              <div style={{
                background: 'rgba(52, 211, 153, 0.15)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardList size={22} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Panel Utama Guru Piket - Persetujuan Izin & Sakit Siswa
                </h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Validasi surat izin dan kehadiran harian siswa[cite: 9]</span>
              </div>
            </div>
            <button onClick={fetchPerizinan} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '9px 16px', borderRadius: '8px', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} color="#34d399" />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* CONTENT UTAMA - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box', flex: 1 }}>
            
            {/* BAR PENCARIAN */}
            <div style={{ marginBottom: '25px', backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
              <Search size={18} color="#34d399" />
              <input
                type="text"
                placeholder="Cari Nama Siswa, Kelas, atau Kategori..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', color: '#ffffff', backgroundColor: 'transparent' }}
              />
            </div>

            {/* LIST KARTU PERIZINAN */}
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>⌛ Memuat data perizinan...</p>
            ) : filteredData.length === 0 ? (
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ background: '#021f18', padding: '14px', borderRadius: '50%', color: '#94a3b8', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <Inbox size={32} />
                  </div>
                </div>
                Belum ada data perizinan siswa.[cite: 9]
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                {filteredData.map((item) => {
                  const isSakit = item.jenis_izin?.includes('[SAKIT]');
                  return (
                    <div key={item.id} style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                      <div>
                        {/* HEADER KARTU */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: '700' }}>
                              {item.nama_siswa || 'Siswa N/A'}
                            </h3>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                              Kelas: {item.kelas || '-'}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', backgroundColor: isSakit ? 'rgba(225, 29, 72, 0.2)' : 'rgba(37, 99, 235, 0.2)', color: isSakit ? '#fb7185' : '#60a5fa', border: isSakit ? '1px solid rgba(251, 113, 133, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)' }}>
                            {isSakit ? '🤒 SAKIT' : '🚗 IZIN'}
                          </span>
                        </div>

                        <div style={{ fontSize: '12.5px', color: '#e2e8f0', marginBottom: '8px', backgroundColor: '#021f18', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                          <strong style={{ color: '#ffffff' }}>Kategori:</strong> {item.jenis_izin}
                        </div>

                        <div style={{ fontSize: '12px', color: '#a7f3d0', marginBottom: '8px' }}>
                          <strong>📅 Waktu:</strong> {item.tanggal} {item.jam_mulai ? `(${item.jam_mulai})` : ''}
                        </div>

                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                          <strong style={{ color: '#ffffff' }}>📝 Alasan:</strong> {item.alasan}
                        </div>

                        {/* LAMPIRAN FOTO DARI SISWA */}
                        <div style={{ marginBottom: '16px', backgroundColor: '#021f18', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#a7f3d0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Paperclip size={14} />
                            <span>Foto Surat Bukti:[cite: 9]</span>
                          </div>
                          {item.lampiran_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={item.lampiran_url}
                                alt="Surat Lampiran"
                                onClick={() => setSelectedImage(item.lampiran_url)}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', cursor: 'pointer' }}
                              />
                              <button
                                type="button"
                                onClick={() => setSelectedImage(item.lampiran_url)}
                                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)' }}
                              >
                                🔍 Perbesar Foto
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada foto lampiran.[cite: 9]</span>
                          )}
                        </div>
                      </div>

                      {/* STATUS & TOMBOL ACC */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8', fontWeight: '600' }}>Status:[cite: 9]</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', backgroundColor: item.status?.includes('DISETUJUI') ? 'rgba(5, 150, 105, 0.2)' : item.status?.includes('TOLAK') ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)', color: item.status?.includes('DISETUJUI') ? '#34d399' : item.status?.includes('TOLAK') ? '#f87171' : '#fcd34d', border: item.status?.includes('DISETUJUI') ? '1px solid rgba(52, 211, 153, 0.3)' : item.status?.includes('TOLAK') ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid rgba(252, 211, 77, 0.3)' }}>
                            {item.status || 'MENUNGGU ACC'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'DISETUJUI PIKET')}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)' }}
                          >
                            <CheckCircle2 size={14} />
                            <span>ACC Piket</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'DITOLAK PIKET')}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' }}
                          >
                            <XCircle size={14} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Guru Piket MindGuard - SMK Budi Bakti Ciwidey
          </footer>
        </div>

        {/* POP-UP PERBESAR FOTO */}
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px', boxSizing: 'border-box' }}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedImage(null)}
                style={{ position: 'absolute', top: '-15px', right: '-15px', backgroundColor: '#dc2626', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="Lampiran Surat Full"
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)', border: '1px solid rgba(52, 211, 153, 0.3)' }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}