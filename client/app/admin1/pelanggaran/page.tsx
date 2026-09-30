'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Loader2, Image as ImageIcon, X, Upload, Eye } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function PelanggaranSiswaPage() {
  const [pelanggaranList, setPelanggaranList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Tambah Pelanggaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [jenisPelanggaran, setJenisPelanggaran] = useState('');
  const [poin, setPoin] = useState<number>(5);
  const [keterangan, setKeterangan] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State Modal View Foto Bukti
  const [viewBuktiUrl, setViewBuktiUrl] = useState<string | null>(null);
  const [loadingBuktiId, setLoadingBuktiId] = useState<string | null>(null);

  useEffect(() => {
    fetchPelanggaran();
  }, []);

  const fetchPelanggaran = async () => {
    setLoading(true);
    const [legacyResult, osisResult] = await Promise.all([
      supabase.from('pelanggaran').select('*').order('created_at', { ascending: false }),
      supabase.from('pelanggaran_siswa').select('*').order('created_at', { ascending: false }),
    ]);

    if (legacyResult.error) {
      console.error('Error fetching legacy violations:', legacyResult.error.message);
    }
    if (osisResult.error) {
      console.error('Error fetching OSIS violations:', osisResult.error.message);
    }

    const osisList = (osisResult.data || []).map((item) => ({
      ...item,
      id: `osis-${item.id}`,
      foto_bukti_path: item.foto_bukti_path || null,
    }));
    const combinedList = [...(legacyResult.data || []), ...osisList].sort((first, second) =>
      new Date(second.created_at || second.tanggal || 0).getTime() -
      new Date(first.created_at || first.tanggal || 0).getTime()
    );
    setPelanggaranList(combinedList);
    setLoading(false);
  };

  // Submit Data Pelanggaran + File Foto Bukti
  const handleSubmitPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa || !jenisPelanggaran) {
      alert('Nama siswa dan jenis pelanggaran wajib diisi!');
      return;
    }

    setSubmitting(true);
    let fotoBuktiPath: string | null = null;

    try {
      // 1. Upload File Bukti ke Bucket Privat 'bukti-pelanggaran' (jika ada)
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `bukti/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bukti-pelanggaran')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Gagal upload foto: ${uploadError.message}`);
        }

        fotoBuktiPath = uploadData.path;
      }

      // 2. Simpan Catatan ke Database SQL
      const { error: insertError } = await supabase.from('pelanggaran').insert([
        {
          nama_siswa: namaSiswa,
          jenis_pelanggaran: jenisPelanggaran,
          poin: Number(poin),
          keterangan: keterangan || null,
          foto_bukti_path: fotoBuktiPath,
          tanggal: new Date().toISOString().split('T')[0],
        },
      ]);

      if (insertError) {
        // Rollback photo upload if table insert fails
        if (fotoBuktiPath) {
          await supabase.storage.from('bukti-pelanggaran').remove([fotoBuktiPath]);
        }
        throw new Error(insertError.message);
      }

      // Reset form & reload
      resetForm();
      setIsModalOpen(false);
      fetchPelanggaran();
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNamaSiswa('');
    setJenisPelanggaran('');
    setPoin(5);
    setKeterangan('');
    setSelectedFile(null);
  };

  // Ambil Signed URL untuk membuka foto privat
  const handleOpenBukti = async (path: string, itemId: string) => {
    if (!path) return;
    setLoadingBuktiId(itemId);

    try {
      const { data, error } = await supabase.storage
        .from('bukti-pelanggaran')
        .createSignedUrl(path, 3600); // URL aktif selama 1 jam

      if (error) {
        throw error;
      }

      setViewBuktiUrl(data.signedUrl);
    } catch (err: any) {
      alert(`Gagal memuat foto bukti: ${err.message}`);
    } finally {
      setLoadingBuktiId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #193328', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>PELANGGARAN SISWA</h1>
          <p style={{ fontSize: '12px', color: '#688c7d', margin: '4px 0 0 0' }}>Catatan poin dan disiplin dari Supabase</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#fbbf24', color: '#07100d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={16} /> Catat Pelanggaran
        </button>
      </div>

      {/* DATA TABLE */}
      <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#10201a', color: '#688c7d', borderBottom: '1px solid #193328' }}>
              <th style={{ padding: '12px 16px' }}>TANGGAL</th>
              <th style={{ padding: '12px 16px' }}>NAMA SISWA</th>
              <th style={{ padding: '12px 16px' }}>JENIS PELANGGARAN</th>
              <th style={{ padding: '12px 16px' }}>POIN</th>
              <th style={{ padding: '12px 16px' }}>BUKTI FOTO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                  Memuat data pelanggaran...
                </td>
              </tr>
            ) : pelanggaranList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#688c7d' }}>
                  Belum ada catatan pelanggaran di Supabase.
                </td>
              </tr>
            ) : (
              pelanggaranList.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #193328', color: '#e2e8f0' }}>
                  <td style={{ padding: '12px 16px' }}>{item.tanggal || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff' }}>
                    {item.nama_siswa ? `${item.nama_siswa}${item.kelas ? ` (${item.kelas})` : ''}` : '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{item.jenis_pelanggaran || item.keterangan || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#fbbf24', fontWeight: '800' }}>+{item.poin || 5} Poin</td>
                  <td style={{ padding: '12px 16px' }}>
                    {item.foto_bukti_path ? (
                      <button
                        onClick={() => handleOpenBukti(item.foto_bukti_path, item.id || String(idx))}
                        disabled={loadingBuktiId === (item.id || String(idx))}
                        style={{
                          backgroundColor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {loadingBuktiId === (item.id || String(idx)) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Eye size={14} />
                        )}
                        Lihat Bukti
                      </button>
                    ) : (
                      <span style={{ color: '#688c7d', fontSize: '11px' }}>Tidak Ada Foto</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM TAMBAH PELANGGARAN */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #193328', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Catat Pelanggaran Siswa</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#688c7d', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPelanggaran} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a7f3d0', marginBottom: '6px', fontWeight: '600' }}>Nama Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0a1410', border: '1px solid #193328', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a7f3d0', marginBottom: '6px', fontWeight: '600' }}>Jenis Pelanggaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terlambat Masuk Sekolah"
                  value={jenisPelanggaran}
                  onChange={(e) => setJenisPelanggaran(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0a1410', border: '1px solid #193328', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a7f3d0', marginBottom: '6px', fontWeight: '600' }}>Poin Pelanggaran</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={poin}
                    onChange={(e) => setPoin(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0a1410', border: '1px solid #193328', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a7f3d0', marginBottom: '6px', fontWeight: '600' }}>Keterangan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan lokasi atau kronologi..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0a1410', border: '1px solid #193328', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              {/* UPLOAD FOTO BUKTI */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a7f3d0', marginBottom: '6px', fontWeight: '600' }}>Upload Foto Bukti (Opsional)</label>
                <div style={{ border: '1px dashed #193328', borderRadius: '8px', padding: '14px', textAlign: 'center', backgroundColor: '#0a1410', position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#688c7d' }}>
                    <Upload size={20} />
                    <span style={{ fontSize: '12px' }}>
                      {selectedFile ? selectedFile.name : 'Klik atau seret foto bukti ke sini'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #193328', borderRadius: '8px', color: '#688c7d', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', backgroundColor: '#fbbf24', border: 'none', borderRadius: '8px', color: '#07100d', fontSize: '13px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW FOTO BUKTI */}
      {viewBuktiUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
          <div style={{ backgroundColor: '#13261f', border: '1px solid #1d3d30', borderRadius: '16px', maxWidth: '600px', width: '100%', overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #193328', color: '#fff' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#34d399" /> Foto Bukti Pelanggaran
              </span>
              <button onClick={() => setViewBuktiUrl(null)} style={{ background: 'none', border: 'none', color: '#688c7d', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#0a1410' }}>
              <img
                src={viewBuktiUrl}
                alt="Foto Bukti"
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}