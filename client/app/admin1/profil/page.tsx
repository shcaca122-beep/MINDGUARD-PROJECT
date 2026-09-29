'use client';

import React, { useState, useEffect } from 'react';
import { School, Save, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ProfilSekolahPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profil, setProfil] = useState({
    nama_sekolah: 'SMK BUDI BAKTI CIWIDEY',
    alamat: 'Jl. Babakantiga No. 82, Ciwidey, Kab. Bandung, Jawa Barat 40973',
    kepala_sekolah: 'Ahmad Fadhla Fauzan'
  });

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    setLoading(true);
    const { data } = await supabase.from('profil_sekolah').select('*').single();
    if (data) {
      setProfil({
        nama_sekolah: data.nama_sekolah || profil.nama_sekolah,
        alamat: data.alamat || profil.alamat,
        kepala_sekolah: data.kepala_sekolah || profil.kepala_sekolah
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profil_sekolah').upsert([profil]);
    alert('Profil Sekolah Berhasil Diperbarui!');
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>PROFIL SEKOLAH</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Pengaturan informasi resmi lembaga di Supabase</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#34d399', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Perubahan
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#688c7d' }}>
          <Loader2 size={24} className="animate-spin" style={{ display: 'inline' }} />
        </div>
      ) : (
        <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#688c7d', display: 'block', marginBottom: '6px' }}>NAMA SEKOLAH</label>
            <input
              value={profil.nama_sekolah}
              onChange={(e) => setProfil({ ...profil, nama_sekolah: e.target.value })}
              style={{ width: '100%', backgroundColor: '#10201a', border: '1px solid #193328', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#688c7d', display: 'block', marginBottom: '6px' }}>ALAMAT LENGKAP</label>
            <textarea
              value={profil.alamat}
              onChange={(e) => setProfil({ ...profil, alamat: e.target.value })}
              rows={3}
              style={{ width: '100%', backgroundColor: '#10201a', border: '1px solid #193328', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#688c7d', display: 'block', marginBottom: '6px' }}>NAMA KEPALA SEKOLAH</label>
            <input
              value={profil.kepala_sekolah}
              onChange={(e) => setProfil({ ...profil, kepala_sekolah: e.target.value })}
              style={{ width: '100%', backgroundColor: '#10201a', border: '1px solid #193328', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}