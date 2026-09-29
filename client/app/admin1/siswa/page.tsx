'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function DataSiswaPage() {
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSiswa();
  }, []);

  const fetchSiswa = async () => {
    setLoading(true);
    // Mengambil data dari tabel 'users'
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'siswa'); // Hapus .eq('role', 'siswa') jika tabel users khusus siswa saja

    if (!error && data) {
      setSiswaList(data);
    } else {
      // Jika error / kolom role berbeda, ambil semua row dari users
      const { data: allUsers } = await supabase.from('users').select('*');
      if (allUsers) setSiswaList(allUsers);
    }
    setLoading(false);
  };

  const filteredSiswa = siswaList.filter(
    (s) =>
      (s.nama || s.nama_siswa || s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nisn || s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.kelas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>DATA SISWA</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Direktori siswa terdaftar dari tabel users (Supabase)</p>
        </div>
        <button style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Tambah Siswa
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#13261f', border: '1px solid #1d3d30', padding: '8px 12px', borderRadius: '8px', flex: 1 }}>
          <Search size={16} color="#688c7d" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NISN / Nama Siswa / Kelas..."
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#10201a', color: '#688c7d', borderBottom: '1px solid #193328' }}>
              <th style={{ padding: '12px 16px' }}>NISN / ID</th>
              <th style={{ padding: '12px 16px' }}>NAMA SISWA</th>
              <th style={{ padding: '12px 16px' }}>KELAS</th>
              <th style={{ padding: '12px 16px' }}>EMAIL / KONTAK</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data dari tabel users Supabase...
                </td>
              </tr>
            ) : filteredSiswa.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  Tidak ada data siswa ditemukan di tabel users.
                </td>
              </tr>
            ) : (
              filteredSiswa.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #193328', color: '#e2e8f0' }}>
                  <td style={{ padding: '12px 16px' }}>{item.nisn || item.username || item.id || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>{item.nama || item.nama_siswa || item.full_name || 'Siswa'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.kelas || item.class || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.email || item.no_hp || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                      {item.status || 'Aktif'}
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