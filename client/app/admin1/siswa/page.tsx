'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader2, Upload, X, Download } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { readSheet } from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';

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
  password?: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formError, setFormError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [studentForm, setStudentForm] = useState({ nisn: '', nama: '', kelas: '', email: '', password: '' });
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportStudents = async () => {
    if (siswaList.length === 0) {
      setImportMessage('Tidak ada data siswa untuk diekspor.');
      return;
    }

    setIsExporting(true);
    setImportMessage('');
    try {
      const sheetData = [
        ['NISN / ID', 'Nama Siswa', 'Kelas', 'Email / Kontak', 'Status', 'Role'],
        ...siswaList.map((student) => [
          String(student.nisn || student.username || student.id || ''),
          student.nama || student.nama_siswa || student.full_name || '',
          student.kelas || student.class || '',
          student.email || student.no_hp || '',
          student.status || 'Aktif',
          student.role || 'Siswa',
        ]),
      ];
      const date = new Date().toISOString().slice(0, 10);
      await writeExcelFile(sheetData).toFile(`backup-data-siswa-${date}.xlsx`);
      setImportMessage(`${siswaList.length} data siswa berhasil diekspor. Password tidak disertakan.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? `Ekspor gagal: ${error.message}` : 'Ekspor gagal. Coba kembali.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!isSupabaseConfigured) {
      setFormError('Konfigurasi Supabase belum tersedia.');
      return;
    }

    setIsSaving(true);
    const newStudent = {
      nisn: studentForm.nisn.trim(),
      nama: studentForm.nama.trim(),
      kelas: studentForm.kelas.trim(),
      email: studentForm.email.trim().toLowerCase(),
      password: studentForm.password,
      role: 'Siswa',
    };

    const { data, error } = await supabase.from('users').insert(newStudent).select('*').single();
    setIsSaving(false);
    if (error) {
      setFormError(`Gagal menambahkan siswa: ${error.message}`);
      return;
    }

    setSiswaList((current) => [...current.filter((student) => student.nisn !== newStudent.nisn), data as StudentRecord]);
    setDataSource('Supabase dan data sekolah');
    setStudentForm({ nisn: '', nama: '', kelas: '', email: '', password: '' });
    setIsModalOpen(false);
  };

  const handleImportStudents = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportMessage('');

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setImportMessage('Pilih file Excel dengan format .xlsx.');
      return;
    }
    if (!isSupabaseConfigured) {
      setImportMessage('Konfigurasi Supabase belum tersedia.');
      return;
    }

    setIsSaving(true);
    try {
      const rows = await readSheet(file);
      const headers = (rows[0] || []).map(normalizeHeader);
      const findColumn = (row: unknown[], aliases: string[]) => {
        const index = headers.findIndex((header) => aliases.includes(header));
        return index < 0 ? '' : cellText(row[index]);
      };
      const validRecords = new Map<string, Omit<StudentRecord, 'id'>>();
      let invalidRows = 0;

      for (const row of rows.slice(1)) {
        const rawNisn = findColumn(row, ['nisn', 'nis', 'nomorinduksiswa']);
        const nisn = /^\d+$/.test(rawNisn) && rawNisn.length < 10 ? rawNisn.padStart(10, '0') : rawNisn;
        const nama = findColumn(row, ['nama', 'namasiswa', 'namalengkap', 'fullname']);
        const kelas = findColumn(row, ['kelas', 'class']);
        if (!nisn && !nama && !kelas) continue;
        if (!nisn || !nama || !kelas) {
          invalidRows += 1;
          continue;
        }

        const email = findColumn(row, ['email']) || `${nisn}@budibakti.sch.id`;
        validRecords.set(nisn.toLowerCase(), {
          nisn,
          nama,
          kelas,
          email: email.toLowerCase(),
          password: findColumn(row, ['password', 'katasandi']) || nisn,
          role: 'Siswa',
        });
      }

      const records = Array.from(validRecords.values());
      if (records.length === 0) {
        throw new Error('Tidak ada baris valid. Kolom wajib: NISN, Nama, dan Kelas.');
      }

      const imported: StudentRecord[] = [];
      let duplicateRows = 0;
      for (let index = 0; index < records.length; index += 100) {
        const batch = records.slice(index, index + 100);
        const { data: existing, error: lookupError } = await supabase
          .from('users')
          .select('nisn')
          .in('nisn', batch.map((record) => record.nisn || ''));
        if (lookupError) throw lookupError;

        const existingNisn = new Set((existing || []).map((student) => String(student.nisn).toLowerCase()));
        const newRecords = batch.filter((record) => !existingNisn.has((record.nisn || '').toLowerCase()));
        duplicateRows += batch.length - newRecords.length;
        if (newRecords.length === 0) continue;

        const { data: inserted, error: insertError } = await supabase.from('users').insert(newRecords).select('*');
        if (insertError) throw insertError;
        imported.push(...((inserted || newRecords) as StudentRecord[]));
      }

      if (imported.length) {
        setSiswaList((current) => {
          const byNisn = new Map(current.map((student) => [(student.nisn || '').toLowerCase(), student]));
          imported.forEach((student) => byNisn.set((student.nisn || '').toLowerCase(), student));
          return Array.from(byNisn.values());
        });
        setDataSource('Supabase dan data sekolah');
      }
      setImportMessage(`${imported.length} siswa ditambahkan; ${duplicateRows} duplikat dan ${invalidRows} baris tidak valid dilewati.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? `Impor gagal: ${error.message}` : 'Impor gagal. Periksa kembali file Excel.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>DATA SISWA</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Direktori siswa · Sumber: {dataSource || 'Memuat data...'} · XLSX: NISN, Nama, Kelas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input ref={importInputRef} type="file" accept=".xlsx" onChange={handleImportStudents} style={{ display: 'none' }} />
          <button type="button" onClick={() => importInputRef.current?.click()} disabled={isSaving || isExporting} style={{ backgroundColor: '#13261f', color: '#a7f3d0', border: '1px solid #1d3d30', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Upload size={15} /> Impor XLSX
          </button>
          <button type="button" onClick={handleExportStudents} disabled={loading || siswaList.length === 0 || isSaving || isExporting} style={{ backgroundColor: '#13261f', color: '#a7f3d0', border: '1px solid #1d3d30', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: loading || siswaList.length === 0 || isSaving || isExporting ? 0.6 : 1 }}>
            {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {isExporting ? 'Mengekspor...' : 'Ekspor Backup'}
          </button>
          <button type="button" onClick={() => { setFormError(''); setIsModalOpen(true); }} style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>
      </div>

      {importMessage && <p role="status" style={{ margin: '-8px 0 0', color: importMessage.startsWith('Impor gagal') || importMessage.startsWith('Ekspor gagal') ? '#f87171' : '#34d399', fontSize: '12px' }}>{importMessage}</p>}

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

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.72)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-student-title" style={{ width: '100%', maxWidth: '500px', padding: '22px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 id="add-student-title" style={{ margin: 0, fontSize: '16px' }}>Tambah Siswa Baru</h2>
              <button type="button" aria-label="Tutup" onClick={() => setIsModalOpen(false)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <form onSubmit={handleAddStudent} style={{ display: 'grid', gap: '12px' }}>
              {[
                { key: 'nisn', label: 'NISN', type: 'text' },
                { key: 'nama', label: 'Nama lengkap', type: 'text' },
                { key: 'kelas', label: 'Kelas', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: 'Password awal', type: 'password' },
              ].map((field) => (
                <label key={field.key} style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                  {field.label}
                  <input required type={field.type} value={studentForm[field.key as keyof typeof studentForm]} onChange={(event) => setStudentForm((current) => ({ ...current, [field.key]: event.target.value }))} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', outline: 'none', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }} />
                </label>
              ))}
              {formError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{formError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#34d399', color: '#07100d', fontWeight: 700 }}>
                  {isSaving && <Loader2 size={15} className="animate-spin" />}{isSaving ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const normalizeHeader = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cellText = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').trim();