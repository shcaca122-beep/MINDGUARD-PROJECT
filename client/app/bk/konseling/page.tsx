'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function KonselingBKPage() {
  const [konselingList, setKonselingList] = useState<any[]>([]);

  const fetchKonseling = async () => {
    const { data } = await supabase.from('layanan_siswa').select('*').eq('layanan', 'KONSELING').order('created_at', { ascending: false });
    if (data) setKonselingList(data);
  };

  useEffect(() => {
    fetchKonseling();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await supabase.from('layanan_siswa').update({ status }).eq('id', id);
    fetchKonseling();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '30px' }}>
        <h2 style={{ color: '#1b3b2b', margin: '0 0 20px 0' }}>👤 Jadwal Konseling Individual</h2>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1b3b2b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Nama Siswa</th>
                <th style={{ padding: '10px' }}>Jadwal / Sesi</th>
                <th style={{ padding: '10px' }}>Topik Masalah</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Aksi BK</th>
              </tr>
            </thead>
            <tbody>
              {konselingList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama_siswa} ({item.kelas})</td>
                  <td style={{ padding: '10px' }}>{item.tanggal}</td>
                  <td style={{ padding: '10px' }}>{item.judul_pesan || item.topik}</td>
                  <td style={{ padding: '10px' }}>{item.status || 'MENUNGGU ACC'}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => updateStatus(item.id, 'DISETUJUI')} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Setujui</button>
                    <button onClick={() => updateStatus(item.id, 'SELESAI')} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Selesai</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}