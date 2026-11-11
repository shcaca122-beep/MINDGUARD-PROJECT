'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader2, Upload, X, Download, KeyRound, Mail } from 'lucide-react';
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

const studentListCollator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

const csvCell = (value: string) => {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const compareStudentsByClass = (first: StudentRecord, second: StudentRecord) => {
  const firstClass = (first.kelas || first.class || '').trim();
  const secondClass = (second.kelas || second.class || '').trim();
  const gradeOrder = (value: string) => {
    const romanGrade = value.toUpperCase().match(/^(XII|XI|X)(?=[.\s-]|$)/)?.[1];
    return romanGrade === 'X' ? 10 : romanGrade === 'XI' ? 11 : romanGrade === 'XII' ? 12 : 99;
  };

  return (
    gradeOrder(firstClass) - gradeOrder(secondClass) ||
    studentListCollator.compare(firstClass, secondClass) ||
    studentListCollator.compare(first.nama || first.nama_siswa || first.full_name || '', second.nama || second.nama_siswa || second.full_name || '') ||
    studentListCollator.compare(String(first.nisn || first.id || ''), String(second.nisn || second.id || ''))
  );
};

export default function DataSiswaPage() {
  const [siswaList, setSiswaList] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkResetting, setIsBulkResetting] = useState(false);
  const [isBulkResetModalOpen, setIsBulkResetModalOpen] = useState(false);
  const [bulkPassword, setBulkPassword] = useState('');
  const [bulkConfirmation, setBulkConfirmation] = useState('');
  const [bulkResetError, setBulkResetError] = useState('');
  const [formError, setFormError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [resetStudent, setResetStudent] = useState<StudentRecord | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [emailStudent, setEmailStudent] = useState<StudentRecord | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [studentForm, setStudentForm] = useState({ nisn: '', nama: '', kelas: '', email: '', password: '' });
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSiswa = async () => {
      try {
        if (!isSupabaseConfigured) throw new Error('Konfigurasi Supabase belum tersedia.');
        const pageSize = 500;
        const allRows: StudentRecord[] = [];
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from('users')
            .select('id,nisn,nama,kelas,email,role')
            .order('id', { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          allRows.push(...((data || []) as StudentRecord[]));
          if (!data || data.length < pageSize) break;
        }
        const databaseStudents = allRows.filter((student) => {
          const role = (student.role || '').trim().toLowerCase();
          return !role || role.includes('siswa');
        }).sort(compareStudentsByClass);

        if (isMounted) {
          setSiswaList(databaseStudents);
          setDataSource(`Supabase (${databaseStudents.length} siswa)`);
        }
      } catch (error) {
        console.error('Gagal memuat direktori siswa:', error);
        if (isMounted) {
          setSiswaList([]);
          setDataSource(error instanceof Error ? `Gagal memuat: ${error.message}` : 'Data tidak tersedia');
        }
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

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            kind: 'student',
            nisn: newStudent.nisn,
            nama: newStudent.nama,
            kelas: newStudent.kelas,
            email: newStudent.email,
            password: newStudent.password,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.failed?.[0]?.message || result.error || 'Gagal membuat akun.');

      const { data, error } = await supabase
        .from('users')
        .select('id,nisn,nama,kelas,email,role')
        .eq('email', newStudent.email)
        .single();
      if (error) throw error;

      setSiswaList((current) => [...current.filter((student) => student.nisn !== newStudent.nisn), data as StudentRecord]);
      setDataSource('Supabase dan data sekolah');
      setStudentForm({ nisn: '', nama: '', kelas: '', email: '', password: '' });
      setIsModalOpen(false);
    } catch (error) {
      setFormError(`Gagal menambahkan siswa: ${error instanceof Error ? error.message : 'Terjadi kesalahan.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError('');
    if (!resetStudent?.id) {
      setResetError('ID siswa tidak tersedia.');
      return;
    }
    if (resetPassword.length < 12) {
      setResetError('Password sementara minimal 12 karakter.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/admin/accounts/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacyStudentId: String(resetStudent.id), password: resetPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Reset password gagal.');
      setImportMessage(`Password akun ${resetStudent.nama || resetStudent.nisn || 'siswa'} berhasil direset. Sampaikan password sementara secara aman.`);
      setResetStudent(null);
      setResetPassword('');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Reset password gagal.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateRecoveryEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    if (!emailStudent?.id) {
      setEmailError('ID siswa tidak tersedia.');
      return;
    }

    const email = recoveryEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Masukkan alamat email yang valid.');
      return;
    }

    setIsSavingEmail(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legacyId: emailStudent.id,
          account: {
            kind: 'student',
            email,
            nama: emailStudent.nama || emailStudent.nama_siswa || emailStudent.full_name || 'Siswa',
            role: 'Siswa',
            nisn: emailStudent.nisn || '',
            kelas: emailStudent.kelas || emailStudent.class || '',
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memperbarui email siswa.');

      setSiswaList((current) =>
        current.map((student) => student.id === emailStudent.id ? { ...student, email } : student),
      );
      setImportMessage(`Email pemulihan ${emailStudent.nama || emailStudent.nisn || 'siswa'} berhasil diperbarui.`);
      setEmailStudent(null);
      setRecoveryEmail('');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Gagal memperbarui email siswa.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleBulkResetPasswords = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBulkResetError('');
    if (bulkPassword.length < 12) {
      setBulkResetError('Password sementara harus minimal 12 karakter.');
      return;
    }
    if (bulkConfirmation !== 'GANTI SEMUA') {
      setBulkResetError('Ketik GANTI SEMUA untuk mengonfirmasi tindakan.');
      return;
    }

    setIsBulkResetting(true);
    setImportMessage('Sedang mengganti password seluruh akun. Jangan tutup halaman sampai proses selesai.');
    try {
      const response = await fetch('/api/admin/accounts/bulk-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: bulkPassword, confirmation: bulkConfirmation }),
      });
      const result = await response.json() as {
        error?: string;
        total?: number;
        changed?: number;
        legacyPasswordClearFailures?: number;
        roster?: Array<{
          nisn: string;
          studentId: string;
          nama: string;
          kelas: string;
          emailLogin: string;
        }>;
        failed?: Array<{ nisn: string; nama: string; message: string }>;
      };
      if (!response.ok || !result.roster?.length) {
        throw new Error(result.error || 'Reset massal gagal. Daftar siswa tidak tersedia.');
      }

      const csvRows = [
        ['NISN', 'ID Siswa (gunakan jika NISN ganda)', 'Nama', 'Kelas', 'Email Login'],
        ...result.roster.map((student) => [
          student.nisn,
          student.studentId,
          student.nama,
          student.kelas,
          student.emailLogin,
        ]),
      ];
      const csv = `\uFEFF${csvRows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
      const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `daftar-login-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);

      const failures = result.failed || [];
      const failureSummary = failures.length
        ? ` ${failures.length} akun gagal disiapkan. Contoh: ${failures.slice(0, 3).map((failure) => `${failure.nama || failure.nisn || 'akun'} (${failure.message})`).join('; ')}.`
        : '';
      const passwordClearWarning = result.legacyPasswordClearFailures
        ? ` Peringatan: password lama pada ${result.legacyPasswordClearFailures} baris users belum berhasil dikosongkan.`
        : '';
      setImportMessage(
        `Password sementara berhasil diterapkan untuk ${result.changed || result.roster.length} dari ${result.total || result.roster.length} akun. CSV daftar Email Login diunduh. Semua siswa wajib membuat password pribadi baru saat login pertama. Bagikan password sementara secara privat.${failureSummary}${passwordClearWarning}`,
      );
      setIsBulkResetModalOpen(false);
      setBulkPassword('');
      setBulkConfirmation('');
    } catch (error) {
      setBulkResetError(error instanceof Error ? error.message : 'Reset massal gagal.');
    } finally {
      setIsBulkResetting(false);
    }
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
      let failedAccounts = 0;
      const failureMessages: string[] = [];
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

        const response = await fetch('/api/admin/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accounts: newRecords.map((record) => ({
              kind: 'student',
              nisn: record.nisn,
              nama: record.nama,
              kelas: record.kelas,
              email: record.email,
              password: record.password,
            })),
          }),
        });
        const result = await response.json();
        if (!response.ok && response.status !== 207) throw new Error(result.error || 'Impor akun gagal.');
        const failures = (result.failed || []) as Array<{ email: string; message: string }>;
        failedAccounts += failures.length;
        failureMessages.push(...failures.map((failure) => failure.message));
        const failedEmails = new Set(failures.map((failure) => failure.email.toLowerCase()));
        const successfulRecords = newRecords.filter(
          (record) => record.email && !failedEmails.has(record.email.toLowerCase())
        );
        if (successfulRecords.length) {
          const { data: inserted, error: fetchError } = await supabase
            .from('users')
            .select('id,nisn,nama,kelas,email,role')
            .in('nisn', successfulRecords.map((record) => record.nisn || ''));
          if (fetchError) throw fetchError;
          imported.push(...((inserted || []) as StudentRecord[]));
        }
      }

      if (imported.length) {
        setSiswaList((current) => {
          const byNisn = new Map(current.map((student) => [(student.nisn || '').toLowerCase(), student]));
          imported.forEach((student) => byNisn.set((student.nisn || '').toLowerCase(), student));
          return Array.from(byNisn.values());
        });
        setDataSource('Supabase');
      }
      const failureDetail = failureMessages[0] ? ` Contoh kegagalan: ${failureMessages[0]}` : '';
      setImportMessage(
        `${imported.length} siswa ditambahkan; ${duplicateRows} duplikat, ${failedAccounts} gagal dibuat, dan ${invalidRows} baris tidak valid dilewati.${failureDetail}`
      );
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
          <button
            type="button"
            onClick={() => { setBulkResetError(''); setBulkPassword(''); setBulkConfirmation(''); setIsBulkResetModalOpen(true); }}
            disabled={loading || siswaList.length === 0 || isSaving || isExporting || isBulkResetting}
            style={{ backgroundColor: '#7f1d1d', color: '#fee2e2', border: '1px solid #b91c1c', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: loading || siswaList.length === 0 || isSaving || isExporting || isBulkResetting ? 0.6 : 1 }}
          >
            {isBulkResetting ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
            {isBulkResetting ? 'Mengganti semua...' : 'Reset Semua Password'}
          </button>
          <button type="button" onClick={() => { setFormError(''); setIsModalOpen(true); }} style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>
      </div>

      {importMessage && <p role="status" style={{ margin: '-8px 0 0', color: /gagal/i.test(importMessage) ? '#f87171' : '#34d399', fontSize: '12px' }}>{importMessage}</p>}

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
              <th style={{ padding: '12px 16px' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data siswa...
                </td>
              </tr>
            ) : filteredSiswa.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
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
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailError('');
                        setRecoveryEmail(item.email || '');
                        setEmailStudent(item);
                      }}
                      disabled={!item.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '6px', padding: '6px 9px', border: '1px solid #1d3d30', borderRadius: '6px', background: '#10201a', color: '#a7f3d0', cursor: item.id ? 'pointer' : 'not-allowed' }}
                    >
                      <Mail size={13} /> Email pemulihan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetError(''); setResetPassword(''); setResetStudent(item); }}
                      disabled={!item.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 9px', border: '1px solid #1d3d30', borderRadius: '6px', background: '#10201a', color: '#a7f3d0', cursor: item.id ? 'pointer' : 'not-allowed' }}
                    >
                      <KeyRound size={13} /> Reset password
                    </button>
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

      {emailStudent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.72)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-recovery-email-title" style={{ width: '100%', maxWidth: '420px', padding: '22px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 id="student-recovery-email-title" style={{ margin: 0, fontSize: '16px' }}>Email pemulihan siswa</h2>
              <button type="button" aria-label="Tutup" onClick={() => setEmailStudent(null)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <p style={{ margin: '0 0 14px', color: '#a7f3d0', fontSize: '13px' }}>
              {emailStudent.nama || 'Siswa'} · NISN {emailStudent.nisn || '-'}
            </p>
            <form onSubmit={handleUpdateRecoveryEmail} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Email pribadi siswa
                <input required type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', outline: 'none', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }} />
              </label>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5 }}>
                Pastikan alamat ini sudah dikonfirmasi milik siswa. Setelah disimpan, tautan reset kata sandi akan dikirim ke alamat tersebut.
              </p>
              {emailError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{emailError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                <button type="button" onClick={() => setEmailStudent(null)} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isSavingEmail} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#34d399', color: '#07100d', fontWeight: 700 }}>
                  {isSavingEmail && <Loader2 size={15} className="animate-spin" />}{isSavingEmail ? 'Menyimpan...' : 'Simpan email'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {resetStudent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.72)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="reset-student-password-title" style={{ width: '100%', maxWidth: '420px', padding: '22px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 id="reset-student-password-title" style={{ margin: 0, fontSize: '16px' }}>Reset password siswa</h2>
              <button type="button" aria-label="Tutup" onClick={() => setResetStudent(null)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <p style={{ margin: '0 0 14px', color: '#a7f3d0', fontSize: '13px' }}>
              {resetStudent.nama || 'Siswa'} · NISN {resetStudent.nisn || '-'}
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Password sementara (minimal 8 karakter)
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', outline: 'none', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }}
                />
              </label>
              <p style={{ margin: 0, color: '#fbbf24', fontSize: '11px' }}>Berikan password ini kepada siswa melalui saluran yang aman.</p>
              {resetError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{resetError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setResetStudent(null)} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isResetting} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#34d399', color: '#07100d', fontWeight: 700 }}>
                  {isResetting && <Loader2 size={15} className="animate-spin" />}{isResetting ? 'Mereset...' : 'Reset password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isBulkResetModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.78)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="bulk-reset-title" style={{ width: '100%', maxWidth: '480px', padding: '22px', border: '1px solid #b91c1c', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 id="bulk-reset-title" style={{ margin: 0, fontSize: '16px', color: '#fecaca' }}>Reset password semua siswa</h2>
              <button type="button" aria-label="Tutup" disabled={isBulkResetting} onClick={() => setIsBulkResetModalOpen(false)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <p style={{ margin: '0 0 14px', color: '#fecaca', fontSize: '12px', lineHeight: 1.5 }}>
              Password lama semua akun siswa akan langsung tidak berlaku. Password sementara ini sama untuk seluruh siswa. Saat login pertama, setiap siswa wajib menggantinya dengan password pribadi.
            </p>
            <form onSubmit={handleBulkResetPasswords} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Password sementara (minimal 12 karakter)
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={bulkPassword}
                  onChange={(event) => setBulkPassword(event.target.value)}
                  style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', outline: 'none', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Ketik GANTI SEMUA untuk mengonfirmasi
                <input
                  required
                  value={bulkConfirmation}
                  onChange={(event) => setBulkConfirmation(event.target.value)}
                  style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', outline: 'none', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }}
                />
              </label>
              {bulkResetError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{bulkResetError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" disabled={isBulkResetting} onClick={() => setIsBulkResetModalOpen(false)} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isBulkResetting} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#b91c1c', color: '#fff', fontWeight: 700 }}>
                  {isBulkResetting && <Loader2 size={15} className="animate-spin" />}{isBulkResetting ? 'Mengganti semua...' : 'Ganti semua password'}
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