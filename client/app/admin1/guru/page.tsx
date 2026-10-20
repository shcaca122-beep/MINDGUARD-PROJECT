'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type GuruRecord = {
  id?: string | number;
  nama?: string;
  username?: string;
  nip?: string;
  role?: string;
  email?: string;
  kontak?: string;
  password?: string;
};

export default function DataGuruPage() {
  const emptyGuruForm = { nama: '', nip: '', role: 'GURU BK', email: '', password: '' };

  const [guruList, setGuruList] = useState<GuruRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [guruForm, setGuruForm] = useState(emptyGuruForm);

  useEffect(() => {
    let isMounted = true;
    const loadGuru = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('admin_roles').select('id,nama,nip,role,email');
        if (error) {
          console.error('Gagal memuat data guru:', error);
          if (isMounted) setGuruList([]);
          return;
        }
        if (isMounted) setGuruList((data ?? []) as GuruRecord[]);
      } catch (error) {
        console.error('Error saat memuat data guru:', error);
        if (isMounted) setGuruList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadGuru();
    return () => { isMounted = false; };
  }, []);

  const filteredGuru = guruList.filter(
    (g) =>
      g.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setGuruForm(emptyGuruForm);
    setFormError('');
  };

  const openAddModal = () => {
    setEditingId(null);
    setGuruForm(emptyGuruForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: GuruRecord) => {
    setEditingId(item.id ?? null);
    setGuruForm({
      nama: item.nama ?? '',
      nip: item.nip ?? '',
      role: item.role ?? 'GURU BK',
      email: item.email ?? '',
      password: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteGuru = async (item: GuruRecord) => {
    if (!item.id) return;

    const confirmed = window.confirm(`Hapus data admin "${item.nama || item.nip || 'ini'}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'staff', legacyId: item.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus akun.');

      setGuruList((current) => current.filter((guru) => guru.id !== item.id));
    } catch (error: unknown) {
      console.error('Hapus guru gagal:', error);
      window.alert(`Gagal menghapus guru: ${error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.'}`);
    }
  };

  const handleSaveGuru = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const nama = guruForm.nama.trim();
    const nip = guruForm.nip.trim();
    const email = guruForm.email.trim().toLowerCase();
    const password = guruForm.password.trim();

    if (!nama || !nip || !email || (!editingId && !password)) {
      setFormError('Semua field wajib diisi.');
      setIsSaving(false);
      return;
    }

    const payload = {
      kind: 'staff',
      nama,
      nip,
      role: guruForm.role,
      email,
      password,
    };

    try {
      if (editingId) {
        const response = await fetch('/api/admin/accounts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: payload, legacyId: editingId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memperbarui akun.');
        setGuruList((current) => current.map((guru) => guru.id === editingId ? { ...guru, nama, nip, role: guruForm.role, email } : guru));
      } else {
        const response = await fetch('/api/admin/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: payload }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.failed?.[0]?.message || result.error || 'Gagal menambahkan akun.');
        const { data: createdGuru, error: loadError } = await supabase
          .from('admin_roles')
          .select('id,nama,nip,role,email')
          .eq('email', email)
          .single();
        if (loadError) throw loadError;
        setGuruList((current) => [createdGuru as GuruRecord, ...current]);
      }

      closeModal();
    } catch (error: unknown) {
      console.error('Simpan guru gagal:', error);
      setFormError(`Gagal ${editingId ? 'mengubah' : 'menambahkan'} guru: ${error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>DATA GURU BK & STAF</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Kelola daftar pembimbing konseling dan pengelola dari Supabase</p>
        </div>
        <button type="button" onClick={openAddModal} style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Tambah Admin
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
              <th style={{ padding: '12px 16px' }}>NAMA ADMIN</th>
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
                  Tidak ada data admin ditemukan.
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
                    <button type="button" aria-label={`Edit ${item.nama || 'admin'}`} onClick={() => openEditModal(item)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', marginRight: '8px' }}>
                      <Edit3 size={14} />
                    </button>
                    <button type="button" aria-label={`Hapus ${item.nama || 'admin'}`} onClick={() => handleDeleteGuru(item)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={14} />
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
          <section role="dialog" aria-modal="true" aria-labelledby="add-guru-title" style={{ width: '100%', maxWidth: '480px', padding: '22px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 id="add-guru-title" style={{ margin: 0, fontSize: '16px' }}>{editingId ? 'Edit Data Admin' : 'Tambah Data Admin'}</h2>
              <button type="button" aria-label="Tutup" onClick={closeModal} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <form onSubmit={handleSaveGuru} style={{ display: 'grid', gap: '12px' }}>
              {[
                { key: 'nama', label: 'Nama lengkap', type: 'text' },
                { key: 'nip', label: 'NIP', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: editingId ? 'Password baru (opsional)' : 'Password awal', type: 'password' },
              ].map((field) => (
                <label key={field.key} style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                  {field.label}
                  <input required={field.key !== 'password' || !editingId} type={field.type} value={guruForm[field.key as keyof typeof guruForm]} onChange={(event) => setGuruForm((current) => ({ ...current, [field.key]: event.target.value }))} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }} />
                </label>
              ))}
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Role
                <select value={guruForm.role} onChange={(event) => setGuruForm((current) => ({ ...current, role: event.target.value }))} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', background: '#0a1410', color: '#f1f5f9' }}>
                  {['GURU BK', 'PIKET', 'OSIS', 'MPK', 'TU'].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              {formError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{formError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#34d399', color: '#07100d', fontWeight: 700 }}>
                  {isSaving && <Loader2 size={15} className="animate-spin" />}{isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}