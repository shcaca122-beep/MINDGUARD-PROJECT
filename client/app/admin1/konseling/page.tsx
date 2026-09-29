'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SesiKonselingPage() {
  const [konselingList, setKonselingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKonseling();
  }, []);

  const fetchKonseling = async () => {
    setLoading(true);
    const { data } = await supabase.from('konseling').select('*');
    if (data) setKonselingList(data);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>SESI KONSELING</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Jadwal dan catatan sesi konseling dari Supabase</p>
        </div>
        <button style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Buat Sesi Baru
        </button>
      </div>

      <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#10201a', color: '#688c7d', borderBottom: '1px solid #193328' }}>
              <th style={{ padding: '12px 16px' }}>TANGGAL</th>
              <th style={{ padding: '12px 16px' }}>NAMA SISWA</th>
              <th style={{ padding: '12px 16px' }}>GURU BK</th>
              <th style={{ padding: '12px 16px' }}>TOPIK / CATATAN</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data konseling...
                </td>
              </tr>
            ) : konselingList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  Belum ada sesi konseling tercatat di Supabase.
                </td>
              </tr>
            ) : (
              konselingList.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #193328', color: '#e2e8f0' }}>
                  <td style={{ padding: '12px 16px' }}>{item.tanggal || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{item.nama_siswa || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.guru_bk || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.topik || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                      {item.status || 'Selesai'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}