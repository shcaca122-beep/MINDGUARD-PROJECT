'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function JenisLayananPage() {
  const [layananList, setLayananList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLayanan();
  }, []);

  const fetchLayanan = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('jenis_layanan').select('*');
    if (!error && data && data.length > 0) {
      setLayananList(data);
    } else {
      // Default jika tabel belum ada isinya
      setLayananList([
        { nama_layanan: 'Konseling Pribadi', deskripsi: 'Sesi tatap muka pembimbingan masalah personal siswa.' },
        { nama_layanan: 'Konseling Akademik', deskripsi: 'Pembimbingan nilai, kendala belajar, dan motivasi.' },
        { nama_layanan: 'Bimbingan Karir', deskripsi: 'Persiapan kerja, PKL, dan perguruan tinggi.' },
        { nama_layanan: 'Mediasi Konflik', deskripsi: 'Penyelesaian perselisihan antar siswa.' }
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>JENIS LAYANAN BK</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Kategori bentuk pelayanan konseling di database</p>
        </div>
        <button style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Layanan Baru
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#688c7d' }}>
          <Loader2 size={24} className="animate-spin" style={{ display: 'inline' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {layananList.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Layers size={18} color="#34d399" />
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0 }}>{item.nama_layanan || item.title}</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>{item.deskripsi || item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}