'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type KonselingRecord = {
  id?: string | number;
  tanggal?: string;
  created_at?: string;
  nama_siswa?: string;
  nama?: string;
  guru_bk?: string;
  tujuan_konselor?: string;
  topik?: string;
  judul_pesan?: string;
  deskripsi?: string;
  status?: string;
};

export default function SesiKonselingPage() {
  const [konselingList, setKonselingList] = useState<KonselingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadKonseling = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .in('layanan', ['KONSELING', 'KELOMPOK'])
        .order('created_at', { ascending: false });
      if (isMounted) {
        if (error) {
          console.error('Gagal memuat sesi konseling:', error);
          setLoadError(error.message);
        } else {
          setKonselingList((data || []) as KonselingRecord[]);
          setLoadError('');
        }
        setLoading(false);
      }
    };
    void loadKonseling();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>SESI KONSELING</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Jadwal dan catatan sesi konseling dari Supabase</p>
        </div>
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
            ) : loadError ? (
              <tr>
                <td colSpan={5} role="alert" style={{ padding: '24px', textAlign: 'center', color: '#f87171' }}>
                  Gagal memuat sesi konseling: {loadError}
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
                  <td style={{ padding: '12px 16px' }}>{item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{item.nama_siswa || item.nama || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.guru_bk || item.tujuan_konselor || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.topik || item.judul_pesan || item.deskripsi || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
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
  );
}