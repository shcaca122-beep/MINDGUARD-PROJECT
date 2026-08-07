'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

type MasterPelanggaranItem = {
  id?: number | string;
  nama_pelanggaran?: string;
  nama?: string;
  jenis_pelanggaran?: string;
  jenis?: string;
  kategori?: string;
  poin?: number | string;
};

// Fallback Master Data jika tabel di Supabase belum ada isinya / RLS aktif
const DEFAULT_MASTER_PELANGGARAN: MasterPelanggaranItem[] = [
  { id: 1, nama_pelanggaran: 'Terlambat Masuk Sekolah (< 15 Menit)', kategori: 'Kedisiplinan', poin: 5 },
  { id: 2, nama_pelanggaran: 'Terlambat Masuk Sekolah (> 15 Menit)', kategori: 'Kedisiplinan', poin: 10 },
  { id: 3, nama_pelanggaran: 'Seragam / Atribut Tidak Lengkap', kategori: 'Kerapihan', poin: 5 },
  { id: 4, nama_pelanggaran: 'Rambut Panjang / Tidak Sesuai Aturan', kategori: 'Kerapihan', poin: 10 },
  { id: 5, nama_pelanggaran: 'Menggunakan HP Saat KBM Tanpa Izin', kategori: 'Kedisiplinan', poin: 10 },
  { id: 6, nama_pelanggaran: 'Cabut / Membolos Saat Jam Pelajaran', kategori: 'Kedisiplinan', poin: 15 },
  { id: 7, nama_pelanggaran: 'Merokok / Vape di Lingkungan Sekolah', kategori: 'Pelanggaran Berat', poin: 25 },
];

const normalizeMasterItem = (item: any, index: number): MasterPelanggaranItem => {
  const rawName = item?.nama_pelanggaran || item?.nama || item?.jenis_pelanggaran || item?.jenis || `Pelanggaran ${index + 1}`;
  const rawPoin = Number(item?.poin ?? item?.points ?? 5);

  return {
    id: item?.id ?? index + 1,
    nama_pelanggaran: rawName,
    nama: rawName,
    jenis_pelanggaran: rawName,
    jenis: rawName,
    kategori: item?.kategori || item?.kategori_pelanggaran || 'Kedisiplinan',
    poin: Number.isFinite(rawPoin) ? rawPoin : 5,
  };
};

export default function OsisPage() {
  const today = new Date().toISOString().split('T')[0];

  // State Form Input
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('X PPLG 1');
  const [jamKejadian, setJamKejadian] = useState('07:15');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tindakan, setTindakan] = useState('Peringatan Lisan & Binaan OSIS');

  // State Master Pelanggaran
  const [masterPelanggaranList, setMasterPelanggaranList] = useState<MasterPelanggaranItem[]>(DEFAULT_MASTER_PELANGGARAN);
  const [selectedPelanggaran, setSelectedPelanggaran] = useState<string>(DEFAULT_MASTER_PELANGGARAN[0].nama_pelanggaran || '');
  const [selectedKategori, setSelectedKategori] = useState<string>(DEFAULT_MASTER_PELANGGARAN[0].kategori || 'Kedisiplinan');
  const [selectedPoin, setSelectedPoin] = useState<number>(Number(DEFAULT_MASTER_PELANGGARAN[0].poin ?? 5));
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterSource, setMasterSource] = useState<'supabase' | 'fallback'>('fallback');

  // Data List & Loader
  const [listPelanggaran, setListPelanggaran] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-fill Nama Petugas dari User Session
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.nama) {
          setNamaPetugas(session.nama);
        }
      } catch (err) {
        console.error('Error parsing session:', err);
      }
    }
  }, []);

  // 1. Fetch Master Pelanggaran dari Supabase (dengan Smart Fallback)
  const fetchMasterPelanggaran = async () => {
    setMasterLoading(true);

    try {
      const { data, error } = await supabase
        .from('master_pelanggaran')
        .select('*');

      if (!error && data && data.length > 0) {
        setMasterPelanggaranList(data);
        // Fleksibel menangani nama kolom (nama_pelanggaran / nama / jenis)
        const firstItem = data[0];
        const nama = firstItem.nama_pelanggaran || firstItem.nama || firstItem.jenis_pelanggaran || 'Pelanggaran';
        setSelectedPelanggaran(nama);
        setSelectedKategori(firstItem.kategori || 'Kedisiplinan');
        setSelectedPoin(firstItem.poin ?? 5);
      } else {
        // Jika data DB kosong atau kena RLS, gunakan default bawaan
        setMasterPelanggaranList(DEFAULT_MASTER_PELANGGARAN);
        setSelectedPelanggaran(DEFAULT_MASTER_PELANGGARAN[0].nama_pelanggaran);
        setSelectedKategori(DEFAULT_MASTER_PELANGGARAN[0].kategori);
        setSelectedPoin(DEFAULT_MASTER_PELANGGARAN[0].poin);
      }
    } catch (err) {
      console.error('Error fetch master:', err);
      setMasterPelanggaranList(DEFAULT_MASTER_PELANGGARAN);
    }
  };

  // 2. Fetch Catatan Pelanggaran Siswa
  const fetchPelanggaranSiswa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setListPelanggaran(data);
      }
    } catch (err) {
      console.error('Error fetching pelanggaran:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterPelanggaran();
    fetchPelanggaranSiswa();
  }, []);

  // Handler saat user memilih Jenis Pelanggaran dari Dropdown
  const handleSelectPelanggaranChange = (namaPelanggaran: string) => {
    setSelectedPelanggaran(namaPelanggaran);
    const found = masterPelanggaranList.find((item) => {
      const nama = item.nama_pelanggaran || item.nama || item.jenis_pelanggaran;
      return nama === namaPelanggaran;
    });

    if (found) {
      setSelectedKategori(found.kategori || 'Kedisiplinan');
      setSelectedPoin(found.poin ?? 5);
    }
  };

  // Submit Form Input Pelanggaran
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const pencatatAktif = namaPetugas.trim() !== '' ? namaPetugas : 'Pengurus OSIS & MPK';

    try {
      const payload = {
        nama_siswa: namaSiswa,
        kelas: kelas,
        tanggal: today,
        jam_kejadian: jamKejadian,
        jenis_pelanggaran: selectedPelanggaran,
        kategori: selectedKategori,
        poin: Number(selectedPoin),
        keterangan: keterangan || selectedPelanggaran,
        tindakan: tindakan,
        pencatat: pencatatAktif,
      };

      const { error } = await supabase.from('pelanggaran_siswa').insert([payload]);

      if (error) throw error;

      setStatusMsg({
        type: 'success',
        message: `Pelanggaran "${selectedPelanggaran}" (+${selectedPoin} Poin) atas nama ${namaSiswa} berhasil dicatat!`,
      });

      setNamaSiswa('');
      setKeterangan('');
      fetchPelanggaranSiswa();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        message: err.message || 'Gagal menyimpan data pelanggaran.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Data Rekap Pelanggaran
  const filteredData = listPelanggaran.filter(
    (item) =>
      item.nama_siswa?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.jenis_pelanggaran?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.pencatat?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
                Panel Kedisiplinan OSIS & MPK
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Pencatatan & Monitoring Pelanggaran Kedisiplinan Siswa</span>
            </div>
          </div>
          <button onClick={() => { fetchMasterPelanggaran(); fetchPelanggaranSiswa(); }} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔄 Refresh Data
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: '25px 30px', flex: 1 }}>
          
          {statusMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '13px', backgroundColor: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMsg.type === 'success' ? '#15803d' : '#991b1b', border: `1px solid ${statusMsg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
              {statusMsg.type === 'success' ? '✅ ' : '⚠️ '} {statusMsg.message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px', alignItems: 'start' }}>
            
            {/* FORM CATAT PELANGGARAN SISWA */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1b3b2b', borderBottom: '2px solid #1b3b2b', paddingBottom: '8px' }}>
                📝 Form Input Pelanggaran Siswa
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* NAMA SISWA */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                    Nama Siswa Melanggar
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap siswa..."
                    value={namaSiswa}
                    onChange={(e) => setNamaSiswa(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* KELAS & JAM KEJADIAN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                      Kelas
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: X PPLG 1"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                      Jam Tiba / Kejadian
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="07:15 WIB"
                      value={jamKejadian}
                      onChange={(e) => setJamKejadian(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* INPUT NAMA PETUGAS */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    <span style={{ color: '#4c1d95' }}>👤</span> Nama Petugas
                  </label>
                  <input
                    type="text"
                    placeholder="Pengurus OSIS & MPK"
                    value={namaPetugas}
                    onChange={(e) => setNamaPetugas(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      color: '#1e293b'
                    }}
                  />
                </div>

                {/* DROPDOWN DATA MASTER */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                    📌 Pilih Jenis Pelanggaran
                  </label>
                  <select
                    value={selectedPelanggaran}
                    onChange={(e) => handleSelectPelanggaranChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1b3b2b', fontSize: '13px', outline: 'none', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 'bold' }}
                  >
                    {masterPelanggaranList.map((item, index) => {
                      const nama = item.nama_pelanggaran || item.nama || item.jenis_pelanggaran || 'Pelanggaran';
                      return (
                        <option key={item.id || index} value={nama}>
                          {nama} (+{item.poin ?? 5} Poin)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* INDIKATOR POIN OTOMATIS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold', display: 'block' }}>Kategori: {selectedKategori}</span>
                    <span style={{ fontSize: '12px', color: '#7f1d1d', fontWeight: '600' }}>Poin Yang Akan Ditambahkan:</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626', backgroundColor: '#fff', padding: '2px 10px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    +{selectedPoin} POIN
                  </span>
                </div>

                {/* KETERANGAN */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                    Keterangan / Detail Kejadian
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Tidak memakai topi saat upacara / Terlambat 20 menit karena mogok..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* SANKSI */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '5px' }}>
                    Tindakan / Sanksi OSIS & MPK
                  </label>
                  <select
                    value={tindakan}
                    onChange={(e) => setTindakan(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="Peringatan Lisan & Binaan OSIS">📢 Peringatan Lisan & Binaan OSIS</option>
                    <option value="Bersih-bersih Lingkungan Sekolah">🧹 Bersih-bersih Lingkungan Sekolah</option>
                    <option value="Tugas Baca Buku di Perpustakaan">📚 Tugas Baca Buku di Perpustakaan</option>
                    <option value="Diserahkan ke Guru Piket / BK">⚠️ Diserahkan ke Guru Piket / BK</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#1b3b2b',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    marginTop: '6px'
                  }}
                >
                  {isSubmitting ? '⌛ Menyimpan...' : '💾 Simpan Data Pelanggaran'}
                </button>
              </form>
            </div>

            {/* TABEL / REKAP PELANGGARAN SISWA */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1b3b2b' }}>
                  📋 Rekap Pelanggaran Siswa
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Cari nama, kelas, jenis pelanggaran, atau nama petugas..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>⌛ Memuat data...</p>
              ) : filteredData.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', margin: '30px 0' }}>Belum ada pelanggaran yang dicatat.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
                  {filteredData.map((item) => (
                    <div key={item.id} style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', borderLeft: '4px solid #dc2626', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#1b3b2b' }}>{item.nama_siswa}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                            {item.kelas}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                            🚩 +{item.poin ?? 5} Poin
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#991b1b', marginTop: '6px' }}>
                        ⚠️ {item.jenis_pelanggaran}
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                        <strong>⏰ Waktu:</strong> {item.jam_kejadian} WIB ({item.tanggal})
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                        <strong>📝 Detail:</strong> {item.keterangan || '-'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#0369a1', marginTop: '4px', fontWeight: 'bold' }}>
                        🏷️ Sanksi: {item.tindakan}
                      </div>
                      <div style={{ fontSize: '11px', color: '#1e293b', marginTop: '6px', textAlign: 'right', fontWeight: '600' }}>
                        👤 Petugas: <span style={{ color: '#166534' }}>{item.pencatat || 'Pengurus OSIS & MPK'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '12px', textAlign: 'center', fontSize: '11px' }}>
          &copy; 2026 Panel Kedisiplinan OSIS & MPK MindGuard - SMK Budi Bakti Ciwidey
        </footer>
      </div>
    </div>
  );
}