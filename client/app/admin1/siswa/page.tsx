'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type StudentRecord = {
  id?: string | number;
  nisn?: string;
  username?: string;
  nama?: string;
  nama_siswa?: string;
  full_name?: string;
  kelas?: string;
  class?: string;
  email?: string;
  no_hp?: string;
  role?: string;
  status?: string;
};

function parseStudentCsv(csvText: string): StudentRecord[] {
  const rows = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const headers = rows.shift()?.split(';').map((header) => header.trim().toLowerCase()) || [];

  return rows.map((row) => {
    const values = row.split(';').map((value) => value.trim().replace(/^"|"$/g, ''));
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    return {
      nisn: record.nisn,
      email: record.email,
      role: record.role,
      nama: record.nama,
      kelas: record.kelas,
      status: 'Aktif',
    };
  }).filter((student) => student.nisn || student.nama);
}

export default function DataSiswaPage() {
  const [siswaList, setSiswaList] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSiswa = async () => {
      try {
        const csvResponse = await fetch('/DATAMURIDPROYEK.csv');
        if (!csvResponse.ok) throw new Error('File data siswa tidak dapat dimuat.');
        const csvStudents = parseStudentCsv(await csvResponse.text());
        let databaseStudents: StudentRecord[] = [];

        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from('users').select('*');
          if (!error && data) {
            databaseStudents = (data as StudentRecord[]).filter((student) => {
              const role = (student.role || '').trim().toLowerCase();
              return !role || role.includes('siswa');
            });
          } else if (error) {
            console.error('Gagal memuat siswa dari Supabase:', error.message);
          }
        }

        const studentsByNisn = new Map<string, StudentRecord>();
        for (const student of csvStudents) {
          studentsByNisn.set((student.nisn || '').toLowerCase(), student);
        }
        for (const student of databaseStudents) {
          const key = (student.nisn || String(student.id || student.email || student.nama || '')).toLowerCase();
          studentsByNisn.set(key, { ...studentsByNisn.get(key), ...student });
        }

        if (isMounted) {
          setSiswaList(Array.from(studentsByNisn.values()));
          setDataSource(databaseStudents.length > 0 ? 'Supabase dan data sekolah' : 'Data sekolah');
        }
      } catch (error) {
        console.error('Gagal memuat direktori siswa:', error);
        if (isMounted) setDataSource('Data tidak tersedia');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchSiswa();
    return () => {
      isMounted = false;
    };
  }, []);

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
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Direktori siswa · Sumber: {dataSource || 'Memuat data...'}</p>
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
                  Memuat data siswa...
                </td>
              </tr>
            ) : filteredSiswa.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  Tidak ada data siswa ditemukan.
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