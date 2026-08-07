'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function BKPelanggaranPage() {
  const [data, setData] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
            <button onClick={fetchData} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
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
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
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
                {filteredData.map((item, index) => (
                  <div key={item.id || `${item.nama_siswa}-${item.created_at}-${index}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{item.nama_siswa || 'Siswa'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.kelas || '-'} • {item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</div>
                      </div>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                        Poin {item.poin ?? 0}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      {item.tanggal || new Date(item.created_at).toLocaleDateString('id-ID')} • {item.pencatat || 'OSIS'}
                    </div>
                  </div>
                ))}
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
    </div>
  );
}
