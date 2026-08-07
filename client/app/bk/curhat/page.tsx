'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function CurhatBKPage() {
  const [curhatList, setCurhatList] = useState<any[]>([]);

  const fetchCurhat = async () => {
    const { data } = await supabase.from('layanan_siswa').select('*').eq('layanan', 'CURHAT').order('created_at', { ascending: false });
    if (data) setCurhatList(data);
  };

  useEffect(() => {
    fetchCurhat();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '30px' }}>
        <h2 style={{ color: '#1b3b2b', margin: '0 0 20px 0' }}>📩 Pesan Curhat Anonim Siswa</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {curhatList.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '10px', borderLeft: '5px solid #1b3b2b' }}>
              <div style={{ fontWeight: 'bold', color: '#1b3b2b', marginBottom: '4px' }}>🔒 {item.nama_siswa || 'Anonim'} ({item.kelas})</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669' }}>Topik: {item.judul_pesan || item.topik}</div>
              <p style={{ fontSize: '13px', color: '#334155', margin: '8px 0' }}>{item.deskripsi || item.topik}</p>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Diterima: {new Date(item.created_at).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}