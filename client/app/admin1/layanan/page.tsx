'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type LayananRecord = {
  id?: string | number;
  nama_layanan?: string;
  deskripsi?: string;
  title?: string;
  desc?: string;
};

const DEFAULT_LAYANAN: LayananRecord[] = [
  { nama_layanan: 'Konseling Pribadi', deskripsi: 'Sesi tatap muka pembimbingan masalah personal siswa.' },
  { nama_layanan: 'Konseling Akademik', deskripsi: 'Pembimbingan nilai, kendala belajar, dan motivasi.' },
  { nama_layanan: 'Bimbingan Karir', deskripsi: 'Persiapan kerja, PKL, dan perguruan tinggi.' },
  { nama_layanan: 'Mediasi Konflik', deskripsi: 'Penyelesaian perselisihan antar siswa.' },
];

export default function JenisLayananPage() {
  const [layananList, setLayananList] = useState<LayananRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [layananForm, setLayananForm] = useState({ nama_layanan: '', deskripsi: '' });

  useEffect(() => {
    let isMounted = true;
    const loadLayanan = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('jenis_layanan').select('*');
      if (isMounted) {
        const layananByName = new Map(DEFAULT_LAYANAN.map((item) => [item.nama_layanan?.toLowerCase() || '', item]));
        if (!error) {
          for (const item of (data || []) as LayananRecord[]) {
            const name = (item.nama_layanan || item.title || '').toLowerCase();
            layananByName.set(name, item);
          }
        }
        setLayananList(Array.from(layananByName.values()));
        setLoading(false);
      }
    };
    void loadLayanan();
    return () => { isMounted = false; };
  }, []);

  const handleAddLayanan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    const newLayanan = {
      nama_layanan: layananForm.nama_layanan.trim(),
      deskripsi: layananForm.deskripsi.trim(),
    };
    const { data, error } = await supabase.from('jenis_layanan').insert(newLayanan).select('*').single();
    setIsSaving(false);
    if (error) {
      setFormError(`Gagal menambahkan layanan: ${error.message}`);
      return;
    }
    setLayananList((current) => [data || newLayanan, ...current]);
    setLayananForm({ nama_layanan: '', deskripsi: '' });
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>JENIS LAYANAN BK</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Kategori bentuk pelayanan konseling di database</p>
        </div>
        <button type="button" onClick={() => { setFormError(''); setIsModalOpen(true); }} style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <Plus size={16} /> Layanan Baru
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#688c7d' }}>
          <Loader2 size={24} className="animate-spin" style={{ display: 'inline' }} />
        </div>
      ) : (
        layananList.length === 0 ? (
          <p style={{ margin: 0, padding: '28px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#688c7d', textAlign: 'center', fontSize: '12px' }}>Belum ada jenis layanan. Tambahkan layanan baru untuk mulai mengisi daftar.</p>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
        )
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.72)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-service-title" style={{ width: '100%', maxWidth: '480px', padding: '22px', border: '1px solid #1d3d30', borderRadius: '12px', backgroundColor: '#13261f', color: '#f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 id="add-service-title" style={{ margin: 0, fontSize: '16px' }}>Tambah Jenis Layanan</h2>
              <button type="button" aria-label="Tutup" onClick={() => setIsModalOpen(false)} style={{ display: 'grid', placeItems: 'center', padding: '5px', border: '1px solid #1d3d30', borderRadius: '6px', background: 'transparent', color: '#a7f3d0' }}><X size={17} /></button>
            </div>
            <form onSubmit={handleAddLayanan} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Nama layanan
                <input required value={layananForm.nama_layanan} onChange={(event) => setLayananForm((current) => ({ ...current, nama_layanan: event.target.value }))} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', background: '#0a1410', color: '#f1f5f9', boxSizing: 'border-box' }} />
              </label>
              <label style={{ display: 'grid', gap: '5px', color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>
                Deskripsi
                <textarea rows={3} value={layananForm.deskripsi} onChange={(event) => setLayananForm((current) => ({ ...current, deskripsi: event.target.value }))} style={{ width: '100%', padding: '10px 11px', border: '1px solid #1d3d30', borderRadius: '7px', background: '#0a1410', color: '#f1f5f9', resize: 'vertical', boxSizing: 'border-box' }} />
              </label>
              {formError && <p role="alert" style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{formError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 13px', border: '1px solid #1d3d30', borderRadius: '7px', background: 'transparent', color: '#cbd5e1', fontWeight: 600 }}>Batal</button>
                <button type="submit" disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: 0, borderRadius: '7px', background: '#34d399', color: '#07100d', fontWeight: 700 }}>
                  {isSaving && <Loader2 size={15} className="animate-spin" />}{isSaving ? 'Menyimpan...' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}