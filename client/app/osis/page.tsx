'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// MASTER DAFTAR KELAS RESMI SMK BUDI BAKTI CIWIDEY
const DAFTAR_KELAS_GERBANG = [
  'X BRP 1', 'X BRP 2', 'X BRP 3', 'X BRP 4', 'X BRP 5', 'X BRP 6',
  'X RPL 1', 'X RPL 2', 'X RPL 3', 'X RPL 4',
  'X DKV 1', 'X DKV 2',

  'XI BRP 1', 'XI BRP 2', 'XI BRP 3', 'XI BRP 4', 'XI BRP 5', 'XI BRP 6',
  'XI RPL 1', 'XI RPL 2', 'XI RPL 3', 'XI RPL 4',
  'XI DKV 1', 'XI DKV 2',

  'XII BRP 1', 'XII BRP 2', 'XII BRP 3', 'XII BRP 4', 'XII BRP 5', 'XII BRP 6',
  'XII RPL 1', 'XII RPL 2', 'XII RPL 3', 'XII RPL 4',
  'XII DKV 1', 'XII DKV 2', 'XII DKV 3', 'XII DKV 4',
];

// MASTER PELANGGARAN & POIN (Otomatis terhubung ke Panel BK)
const MASTER_PELANGGARAN = [
  { jenis: '👔 Baju / Seragam Tidak Dimasukkan', poin: 5, tingkat: 'Ringan' },
  { jenis: '🏷️ Tidak Memakai Badge / Kaos Kaki Putih', poin: 5, tingkat: 'Ringan' },
  { jenis: '👟 Sepatu / Kaos Dalam Tidak Sesuai Ketentuan', poin: 10, tingkat: 'Ringan' },
  { jenis: '🧢 Memakai Topi Bebas di Lingkungan Sekolah', poin: 10, tingkat: 'Ringan' },
  { jenis: '👖 Celana / Rok Tidak Sesuai Ketentuan', poin: 10, tingkat: 'Ringan' },
  { jenis: '🥋 Tidak Memakai Ikat Pinggang', poin: 10, tingkat: 'Ringan' },
  { jenis: '🧥 Memakai Sweater/Jaket di Sekolah', poin: 10, tingkat: 'Ringan' },
  { jenis: '💇 Rambut Tidak Rapi / Diwarnai / Nyentrik', poin: 10, tingkat: 'Sedang' },
  { jenis: '⏰ Terlambat Masuk Sekolah (> 10 Menit)', poin: 5, tingkat: 'Ringan' },
  { jenis: '🏃 Meninggalkan Kelas Tanpa Izin (Bolos)', poin: 15, tingkat: 'Sedang' },
  { jenis: '📱 Membawa Handphone Tanpa Izin', poin: 25, tingkat: 'Sedang' },
  { jenis: '🚬 Merokok di Lingkungan Sekolah', poin: 100, tingkat: 'Berat' },
];

interface Petugas {
  id: string;
  nama: string;
  org: 'OSIS' | 'MPK';
}

export default function DashboardOSISMPK() {
  // STATE DAFTAR TIM PETUGAS JAGA GERBANG
  const [listPetugas, setListPetugas] = useState<Petugas[]>([
    { id: '1', nama: 'Anggi', org: 'OSIS' },
    { id: '2', nama: 'Silvia', org: 'MPK' },
  ]);

  // STATE PETUGAS PENULIS/PELAPOR SAAT INI
  const [selectedPetugasId, setSelectedPetugasId] = useState<string>('1');

  // STATE MODAL KELOLA TIM JAGA
  const [showModalKelolaTim, setShowModalKelolaTim] = useState(false);
  const [inputNamaBaru, setInputNamaBaru] = useState('');
  const [inputOrgBaru, setInputOrgBaru] = useState<'OSIS' | 'MPK'>('OSIS');

  // STATE DATA PELANGGARAN & SEARCH
  const [dataPelanggaran, setDataPelanggaran] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // STATE FORM INPUT GERBANG
  const [showModalInput, setShowModalInput] = useState(false);
  const [inputNamaSiswa, setInputNamaSiswa] = useState('');
  const [inputKelasSiswa, setInputKelasSiswa] = useState(DAFTAR_KELAS_GERBANG[0]);
  const [inputJenisPelanggaran, setInputJenisPelanggaran] = useState(MASTER_PELANGGARAN[0].jenis);
  const [inputKeterangan, setInputKeterangan] = useState('');
  const [searchPreset, setSearchPreset] = useState('');

  // 🔄 AMBIL DATA DARI SUPABASE & SYNC LOCALSTORAGE
  const fetchDataFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('pelanggaran').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const normalizedData = data.map((item) => ({
          ...item,
          jenis: item.jenis_pelanggaran || item.jenis,
          shift: item.role_petugas || item.shift || 'Gerbang (OSIS & MPK)',
        }));
        setDataPelanggaran(normalizedData);
        localStorage.setItem('mindguard_pelanggaran', JSON.stringify(normalizedData));
      }
    } catch (e) {
      console.error('Gagal mengambil data Supabase:', e);
    }
  };

  // 🔄 LOAD DATA & LISTEN SYNC REALTIME WITH BK PANEL
  useEffect(() => {
    fetchDataFromSupabase();

    const loadLocalData = () => {
      const saved = localStorage.getItem('mindguard_pelanggaran');
      if (saved) {
        try {
          setDataPelanggaran(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('storage', loadLocalData);
    window.addEventListener('update_pelanggaran', loadLocalData);
    return () => {
      window.removeEventListener('storage', loadLocalData);
      window.removeEventListener('update_pelanggaran', loadLocalData);
    };
  }, []);

  // ➕ TAMBAH PETUGAS JAGA BARU
  const handleTambahPetugas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNamaBaru.trim()) return;

    const baru: Petugas = {
      id: Date.now().toString(),
      nama: inputNamaBaru.trim(),
      org: inputOrgBaru,
    };

    const updatedList = [...listPetugas, baru];
    setListPetugas(updatedList);
    setSelectedPetugasId(baru.id);
    setInputNamaBaru('');
  };

  // 🗑️ HAPUS PETUGAS DARI TIM
  const handleHapusPetugas = (id: string) => {
    if (listPetugas.length <= 1) {
      alert('Minimal harus ada 1 petugas jaga aktif di gerbang!');
      return;
    }
    const updated = listPetugas.filter((p) => p.id !== id);
    setListPetugas(updated);
    if (selectedPetugasId === id) {
      setSelectedPetugasId(updated[0].id);
    }
  };

  // 💾 SIMPAN DATA PELANGGARAN GERBANG (SUPABASE + LOCALSTORAGE)
  const handleSimpanPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNamaSiswa.trim()) return;

    const petugasPencatat = listPetugas.find((p) => p.id === selectedPetugasId) || listPetugas[0];
    const match = MASTER_PELANGGARAN.find((m) => m.jenis === inputJenisPelanggaran);
    const poinOtomatis = match ? match.poin : 5;
    const tglISO = new Date().toISOString().split('T')[0];

    const payloadSupabase = {
      nama: inputNamaSiswa.trim(),
      kelas: inputKelasSiswa,
      jenis_pelanggaran: inputJenisPelanggaran,
      poin: poinOtomatis,
      role_petugas: `Gerbang (${petugasPencatat.org})`,
      nama_petugas: petugasPencatat.nama,
      tanggal: tglISO,
    };

    const { error } = await supabase.from('pelanggaran').insert([payloadSupabase]);

    if (error) {
      console.error('Error insert Supabase:', error.message);
      alert('Gagal simpan ke database Supabase: ' + error.message);
      return;
    }

    const dataBaruLocal = {
      id: Date.now().toString(),
      nama: payloadSupabase.nama,
      kelas: payloadSupabase.kelas,
      jenis: inputJenisPelanggaran,
      jenis_pelanggaran: inputJenisPelanggaran,
      poin: poinOtomatis,
      shift: `Gerbang (${petugasPencatat.org})`,
      role_petugas: payloadSupabase.role_petugas,
      nama_petugas: payloadSupabase.nama_petugas,
      tanggal: tglISO,
      keterangan: inputKeterangan.trim()
        ? `[Petugas ${petugasPencatat.org}: ${petugasPencatat.nama}] ${inputKeterangan.trim()}`
        : `[Petugas ${petugasPencatat.org}: ${petugasPencatat.nama}] Dicatat di gerbang`,
    };

    const updatedLocal = [dataBaruLocal, ...dataPelanggaran];
    setDataPelanggaran(updatedLocal);
    localStorage.setItem('mindguard_pelanggaran', JSON.stringify(updatedLocal));
    window.dispatchEvent(new Event('update_pelanggaran'));

    alert('✅ Pelanggaran berhasil dicatat ke Database Supabase!');

    // Reset Form Input
    setInputNamaSiswa('');
    setInputKeterangan('');
    setSearchPreset('');
    setShowModalInput(false);

    fetchDataFromSupabase();
  };

  // 🗑️ HAPUS LOG CATATAN SISWA
  const handleHapusCatatan = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) {
      await supabase.from('pelanggaran').delete().eq('id', id);

      const updated = dataPelanggaran.filter((item) => item.id !== id);
      setDataPelanggaran(updated);
      localStorage.setItem('mindguard_pelanggaran', JSON.stringify(updated));
      window.dispatchEvent(new Event('update_pelanggaran'));
    }
  };

  const dataGerbangFiltered = dataPelanggaran.filter((item) => {
    const namaSiswa = item.nama || '';
    const kelasSiswa = item.kelas || '';
    const jenisPelanggaran = item.jenis || item.jenis_pelanggaran || '';

    return (
      namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelasSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenisPelanggaran.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937' }}>
      
      {/* NAVBAR POS GERBANG - SESUAI WARNA DASHBOARD BK */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '14px 28px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* LOGO & SYSTEM TITLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MINDGUARD</div>
              <span style={{ fontSize: '11px', backgroundColor: '#2d523e', padding: '3px 8px', borderRadius: '12px', color: '#a7f3d0', fontWeight: '600' }}>
                POS KETERTIBAN GERBANG • OSIS & MPK
              </span>
            </div>
          </div>

          {/* TIM JAGA BADGES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#2d523e', padding: '6px 14px', borderRadius: '20px', border: '1px solid #3e6b52' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '600' }}>Tim Jaga Aktif:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {listPetugas.map((p) => (
                <span
                  key={p.id}
                  style={{
                    backgroundColor: '#ffffff',
                    color: p.org === 'OSIS' ? '#0284c7' : '#7c3aed',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {p.nama} ({p.org})
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowModalKelolaTim(true)}
              style={{
                backgroundColor: '#ffffff',
                color: '#1b3b2b',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              ⚙️ Kelola
            </button>
          </div>

        </div>
      </nav>

      {/* CONTAINER UTAMA */}
      <main style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
        
        {/* HEADER TITLE & TOMBOL CATAT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1b3b2b', fontSize: '22px', fontWeight: '800' }}>
              Pencatatan Pelanggaran Gerbang
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
              Sistem input presisi ketertiban siswa. Data tersinkronisasi otomatis dengan Bimbingan Konseling (BK).
            </p>
          </div>

          <button
            onClick={() => setShowModalInput(true)}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            <span style={{ fontSize: '16px' }}>➕</span> Catat Pelanggaran Siswa
          </button>
        </div>

        {/* KARTU STATISTIK RINGKAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL DICATAT GERBANG</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#1b3b2b' }}>
              {dataGerbangFiltered.length} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>Siswa</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', letterSpacing: '0.5px' }}>PETUGAS ON-DUTY</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: '#1b3b2b' }}>
              {listPetugas.length} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>Anggota Active</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', letterSpacing: '0.5px' }}>INTEGRASI PANEL BK</span>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '10px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              Terhubung Realtime Supabase
            </div>
          </div>

        </div>

        {/* TABEL LOG CATATAN GERBANG */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          
          {/* SEARCH BAR & TITLE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px', fontWeight: 'bold' }}>Log Pelanggaran Gerbang Hari Ini</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Menampilkan data siswa yang ditindak oleh OSIS & MPK</p>
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="🔍 Cari Nama, Kelas, Pelanggaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* TABEL */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1b3b2b', color: '#ffffff' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>NAMA SISWA</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>KELAS</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>JENIS PELANGGARAN</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>POIN</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>PETUGAS PELAPOR</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>TANGGAL</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>KETERANGAN</th>
                <th style={{ padding: '12px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {dataGerbangFiltered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    Belum ada catatan pelanggaran siswa yang cocok/tersedia.
                  </td>
                </tr>
              ) : (
                dataGerbangFiltered.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#111827', textTransform: 'capitalize' }}>
                      {item.nama}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#1b3b2b', fontSize: '11px' }}>
                        {item.kelas}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#991b1b' }}>
                      {item.jenis || item.jenis_pelanggaran}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px' }}>
                        +{item.poin || 5} Pts
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#4b5563' }}>
                      <span style={{ fontWeight: '600' }}>{item.role_petugas || item.shift}</span>
                      <br />
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>{item.nama_petugas || '-'}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#6b7280' }}>
                      {item.tanggal}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#6b7280', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.keterangan || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleHapusCatatan(item.id)}
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>
      </main>

      {/* MODAL 1: FORM CATAT SISWA MELANGGAR */}
      {showModalInput && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '16px', fontWeight: 'bold' }}>➕ Catat Pelanggaran Gerbang</h3>
              <button onClick={() => setShowModalInput(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>✖</button>
            </div>
            
            <form onSubmit={handleSimpanPelanggaran} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Petugas Pelapor / Pencatat:
                </label>
                <select
                  value={selectedPetugasId}
                  onChange={(e) => setSelectedPetugasId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold' }}
                >
                  {listPetugas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.org})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Kelas Siswa:</label>
                  <select
                    value={inputKelasSiswa}
                    onChange={(e) => setInputKelasSiswa(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  >
                    {DAFTAR_KELAS_GERBANG.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nama Siswa:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Siswa"
                    value={inputNamaSiswa}
                    onChange={(e) => setInputNamaSiswa(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* SEARCH PRESET PELANGGARAN */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Pilih Pelanggaran:</label>
                <input
                  type="text"
                  placeholder="🔍 Cari jenis pelanggaran (cth: sepatu, topi, HP)..."
                  value={searchPreset}
                  onChange={(e) => setSearchPreset(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #10b981', fontSize: '11px', marginBottom: '6px', boxSizing: 'border-box', backgroundColor: '#f0fdf4' }}
                />

                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f9fafb' }}>
                  {MASTER_PELANGGARAN
                    .filter((m) => m.jenis.toLowerCase().includes(searchPreset.toLowerCase()))
                    .map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputJenisPelanggaran(m.jenis)}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          border: inputJenisPelanggaran === m.jenis ? '1px solid #dc2626' : '1px solid #e5e7eb',
                          backgroundColor: inputJenisPelanggaran === m.jenis ? '#fef2f2' : '#ffffff',
                          color: inputJenisPelanggaran === m.jenis ? '#991b1b' : '#374151',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{m.jenis}</span>
                        <span style={{ color: '#dc2626', marginLeft: '6px' }}>+{m.poin} Pts</span>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Catatan Detail / Keterangan Tambahan:</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Datang jam 07:20, sepatu berwarna putih..."
                  value={inputKeterangan}
                  onChange={(e) => setInputKeterangan(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalInput(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  🚨 Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KELOLA TIM PETUGAS JAGA */}
      {showModalKelolaTim && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px', fontWeight: 'bold' }}>👥 Kelola Tim Jaga Gerbang</h3>
              <button onClick={() => setShowModalKelolaTim(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>✖</button>
            </div>

            {/* FORM TAMBAH ANGGOTA */}
            <form onSubmit={handleTambahPetugas} style={{ marginBottom: '16px', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                + Tambah Anggota OSIS / MPK
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={inputOrgBaru}
                  onChange={(e) => setInputOrgBaru(e.target.value as 'OSIS' | 'MPK')}
                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold' }}
                >
                  <option value="OSIS">OSIS</option>
                  <option value="MPK">MPK</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="Nama Anggota Jaga"
                  value={inputNamaBaru}
                  onChange={(e) => setInputNamaBaru(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px' }}
                />
              </div>
              <button
                type="submit"
                style={{ width: '100%', backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                Masukkan ke Tim Jaga
              </button>
            </form>

            {/* LIST ANGGOTA AKTIF */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daftar Petugas Aktif Jaga:</h4>
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {listPetugas.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: p.org === 'OSIS' ? '#e0f2fe' : '#f3e8ff', color: p.org === 'OSIS' ? '#0284c7' : '#7c3aed', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                      {p.org}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>{p.nama}</span>
                  </div>
                  <button
                    onClick={() => handleHapusPetugas(p.id)}
                    style={{ backgroundColor: 'transparent', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowModalKelolaTim(false)}
                style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}