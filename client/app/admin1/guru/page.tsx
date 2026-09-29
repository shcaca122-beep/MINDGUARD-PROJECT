'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit3, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function DataGuruPage() {
  const [guruList, setGuruList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGuru();
  }, []);

  const fetchGuru = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('admin_roles').select('*');
    if (!error && data) {
      setGuruList(data);
    }
    setLoading(false);
  };

  const filteredGuru = guruList.filter(
    (g) =>
      g.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>DATA GURU BK & STAF</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Kelola daftar pembimbing konseling dan pengelola dari Supabase</p>
        </div>
        <button style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Tambah Guru
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#13261f', border: '1px solid #1d3d30', padding: '8px 12px', borderRadius: '8px', width: '300px' }}>
          <Search size={16} color="#688c7d" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama / NIP / role..."
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#10201a', color: '#688c7d', borderBottom: '1px solid #193328' }}>
              <th style={{ padding: '12px 16px' }}>NIP / ID</th>
              <th style={{ padding: '12px 16px' }}>NAMA GURU</th>
              <th style={{ padding: '12px 16px' }}>ROLE</th>
              <th style={{ padding: '12px 16px' }}>KONTAK / EMAIL</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data dari Supabase...
                </td>
              </tr>
            ) : filteredGuru.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  Tidak ada data guru ditemukan.
                </td>
              </tr>
            ) : (
              filteredGuru.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #193328', color: '#e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.nip || item.id || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{item.nama || item.username || 'Tanpa Nama'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                      {item.role || 'GURU BK'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{item.email || item.kontak || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', marginRight: '8px' }}><Edit3 size={14} /></button>
                    <button style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
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