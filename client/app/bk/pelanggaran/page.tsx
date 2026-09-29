'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Eye, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function BKPelanggaranPage() {
  const [data, setData] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // State Modal View Foto Bukti
  const [viewBuktiUrl, setViewBuktiUrl] = useState<string | null>(null);
  const [loadingBuktiId, setLoadingBuktiId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: masterResult, error: masterError } = await supabase
        .from('master_pelanggaran')
        .select('*')
        .order('poin', { ascending: false });

      if (error) throw error;
      setData(result || []);

      if (!masterError) {
        setMasterData(masterResult || []);
      } else {
        setMasterData([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data pelanggaran:', err);
      setData([]);
      setMasterData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handlePelanggaranUpdate = () => {
      fetchData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pelanggaran-updated', handlePelanggaranUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pelanggaran-updated', handlePelanggaranUpdate);
      }
    };
  }, []);

  // Ambil Signed URL untuk melihat gambar privat di Supabase Storage
  const handleOpenBukti = async (path: string, itemId: string) => {
    if (!path) return;
    setLoadingBuktiId(itemId);

    try {
      const { data: signedData, error } = await supabase.storage
        .from('bukti-pelanggaran')
        .createSignedUrl(path, 3600); // URL aktif selama 1 jam

      if (error) throw error;
      setViewBuktiUrl(signedData.signedUrl);
    } catch (err: any) {
      alert(`Gagal memuat foto bukti: ${err.message}`);
    } finally {
      setLoadingBuktiId(null);
    }
  };

  const filteredData = data.filter((item) => {
    const text = `${item.nama_siswa || ''} ${item.kelas || ''} ${item.jenis_pelanggaran || item.jenis || ''} ${item.pencatat || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1b3b2b' }}>🚨 Data Pelanggaran BK</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Daftar poin pelanggaran yang tersimpan di tabel master_pelanggaran</p>
            </div>
            <button onClick={fetchData} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Cari nama siswa, kelas, jenis pelanggaran, atau pencatat..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#1b3b2b' }}>📌 Rekap Pelanggaran Masuk dari OSIS</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>⏳ Memuat data pelanggaran...</div>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Belum ada data pelanggaran yang cocok.</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredData.map((item, index) => {
                  const itemId = item.id || `${item.nama_siswa}-${item.created_at}-${index}`;
                  return (
                    <div key={itemId} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{item.nama_siswa || 'Siswa'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.kelas || '-'} • {item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</div>
                        </div>
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          Poin {item.poin ?? 0}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          📅 {item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-')} • 👤 {item.pencatat || 'OSIS/Piket'}
                        </div>

                        {item.foto_bukti_path ? (
                          <button
                            onClick={() => handleOpenBukti(item.foto_bukti_path, String(itemId))}
                            disabled={loadingBuktiId === String(itemId)}
                            style={{
                              backgroundColor: '#1b3b2b',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            {loadingBuktiId === String(itemId) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Eye size={12} />
                            )}
                            Lihat Foto Bukti
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Foto Bukti</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#1b3b2b' }}>📚 Referensi Poin Pelanggaran</h3>
            {masterData.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px' }}>Belum ada data referensi poin di tabel master_pelanggaran.</div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {masterData.slice(0, 8).map((item, index) => (
                  <div key={item.id || `${item.nama_pelanggaran || item.jenis_pelanggaran}-${index}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{item.nama_pelanggaran || item.jenis_pelanggaran || 'Pelanggaran'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.kategori || item.tingkat || 'Tanpa kategori'}</div>
                      </div>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>Poin {item.poin ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW FOTO BUKTI */}
      {viewBuktiUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '560px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1b3b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#1b3b2b" /> Bukti Pelanggaran Siswa
              </span>
              <button onClick={() => setViewBuktiUrl(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
              <img
                src={viewBuktiUrl}
                alt="Foto Bukti Pelanggaran"
                style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}