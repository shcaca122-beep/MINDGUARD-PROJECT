'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // 👈 IMPORT SUPABASE DITAMBAHKAN

// MASTER PELANGGARAN & POIN (Otomatis terhubung ke Panel BK)
const MASTER_PELANGGARAN = [
  { jenis: 'Terlambat Masuk Sekolah', poin: 5, tingkat: 'Ringan' },
  { jenis: 'Atribut / Seragam Tidak Lengkap', poin: 5, tingkat: 'Ringan' },
  { jenis: 'Sepatu / Kaos Kaki Tidak Sesuai', poin: 5, tingkat: 'Ringan' },
  { jenis: 'Rambut Tidak Rapi / Diwarnai', poin: 10, tingkat: 'Sedang' },
  { jenis: 'Riasan / Perhiasan Berlebihan', poin: 10, tingkat: 'Sedang' },
  { jenis: 'Atribut Dasi / Sabuk Tidak Ada', poin: 5, tingkat: 'Ringan' },
  { jenis: 'Merokok di Lingkungan Sekolah', poin: 50, tingkat: 'Berat' },
];

interface Petugas {
  id: string;
  nama: string;
  org: 'OSIS' | 'MPK';
}

export default function DashboardOSISMPK() {
  // STATE DAFTAR TIM PETUGAS JAGA GERBANG
  const [listPetugas, setListPetugas] = useState<Petugas[]>([
    { id: '1', nama: 'Angga PR', org: 'OSIS' },
    { id: '2', nama: 'Siti Rahma', org: 'MPK' },
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
  const [inputKelasSiswa, setInputKelasSiswa] = useState('');
  const [inputJenisPelanggaran, setInputJenisPelanggaran] = useState(MASTER_PELANGGARAN[0].jenis);
  const [inputKeterangan, setInputKeterangan] = useState('');

  // 🔄 AMBIL DATA DARI SUPABASE & SYNC LOCALSTORAGE
  const fetchDataFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('pelanggaran').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        // Normalisasi properti agar terbaca sempurna di tabel UI OSIS & BK
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
    if (!inputNamaSiswa.trim() || !inputKelasSiswa.trim()) return;

    const petugasPencatat = listPetugas.find((p) => p.id === selectedPetugasId) || listPetugas[0];
    const match = MASTER_PELANGGARAN.find((m) => m.jenis === inputJenisPelanggaran);
    const poinOtomatis = match ? match.poin : 5;
    const tglISO = new Date().toISOString().split('T')[0];

    // Payload yang disesuaikan dengan kolom tabel 'pelanggaran' Supabase
    const payloadSupabase = {
      nama: inputNamaSiswa.trim(),
      kelas: inputKelasSiswa.trim().toUpperCase(),
      jenis_pelanggaran: inputJenisPelanggaran,
      poin: poinOtomatis,
      role_petugas: `Gerbang (${petugasPencatat.org})`,
      nama_petugas: petugasPencatat.nama,
      tanggal: tglISO,
    };

    // 🚀 1. SIMPAN LANGSUNG KE SUPABASE DATABASE
    const { error } = await supabase.from('pelanggaran').insert([payloadSupabase]);

    if (error) {
      console.error('Error insert Supabase:', error.message);
      alert('Gagal simpan ke database Supabase: ' + error.message);
      return;
    }

    // 🔄 2. SIMPAN JUGA KE LOCALSTORAGE UNTUK SINKRONISASI SEKETIKA
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
    setInputKelasSiswa('');
    setInputKeterangan('');
    setShowModalInput(false);

    // Refresh data dari database
    fetchDataFromSupabase();
  };

  // 🗑️ HAPUS LOG CATATAN SISWA
  const handleHapusCatatan = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) {
      // Hapus dari Supabase jika ada ID valid
      await supabase.from('pelanggaran').delete().eq('id', id);

      const updated = dataPelanggaran.filter((item) => item.id !== id);
      setDataPelanggaran(updated);
      localStorage.setItem('mindguard_pelanggaran', JSON.stringify(updated));
      window.dispatchEvent(new Event('update_pelanggaran'));
    }
  };

  // Filter khusus data gerbang & search
  const dataGerbangFiltered = dataPelanggaran.filter((item) => {
    const isGerbang = true; // Menampilkan seluruh data pelanggaran yang dicatat
    const namaSiswa = item.nama || '';
    const kelasSiswa = item.kelas || '';
    const jenisPelanggaran = item.jenis || item.jenis_pelanggaran || '';

    const matchesSearch =
      namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelasSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenisPelanggaran.toLowerCase().includes(searchTerm.toLowerCase());
    return isGerbang && matchesSearch;
  });

  return (
    <div style={{ backgroundColor: '#0b0f19', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#f8fafc' }}>
      
      {/* PROFESSIONAL NAVBAR */}
      <nav style={{ backgroundColor: '#111827', borderBottom: '1px solid #1e293b', padding: '16px 28px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* LOGO & SYSTEM TITLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MINDGUARD
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Pos Ketertiban Gerbang • OSIS & MPK
              </div>
            </div>
          </div>

          {/* ACTIVE ON-DUTY OFFICERS BADGES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
              Tim Jaga Aktif:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {listPetugas.map((p) => (
                <span
                  key={p.id}
                  style={{
                    backgroundColor: p.org === 'OSIS' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                    color: p.org === 'OSIS' ? '#38bdf8' : '#c084fc',
                    border: `1px solid ${p.org === 'OSIS' ? 'rgba(2, 132, 199, 0.4)' : 'rgba(124, 58, 237, 0.4)'}`,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  {p.nama} ({p.org})
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowModalKelolaTim(true)}
              style={{
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '4px'
              }}
            >
              ⚙️ Kelola
            </button>
          </div>

        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 20px' }}>
        
        {/* DASHBOARD HEADER & QUICK ACTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Pencatatan Pelanggaran Gerbang
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0' }}>
              Sistem input presisi ketertiban siswa. Data tersinkronisasi otomatis dengan Bimbingan Konseling (BK).
            </p>
          </div>

          <button
            onClick={() => setShowModalInput(true)}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 22px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.1s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Catat Pelanggaran Siswa
          </button>
        </div>

        {/* METRICS & STATS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>TOTAL DICATAT GERBANG</span>
              <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#38bdf8' }}>📋</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', marginTop: '8px' }}>
              {dataGerbangFiltered.length} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Siswa</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>PETUGAS ON-DUTY</span>
              <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#c084fc' }}>🛡️</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', marginTop: '8px' }}>
              {listPetugas.length} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Anggota Active</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>INTEGRASI PANEL BK</span>
              <span style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>⚡</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4ade80', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              Terhubung Realtime Supabase
            </div>
          </div>

        </div>

        {/* LOG DATA TABLE CONTAINER */}
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          
          {/* TABLE TOOLBAR (SEARCH & TITLE) */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                Log Pelanggaran Gerbang Hari Ini
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Menampilkan data siswa yang ditindak oleh OSIS & MPK
              </p>
            </div>

            {/* SEARCH INPUT BAR */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <input
                type="text"
                placeholder="Cari Nama, Kelas, Pelanggaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0b0f19',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px 14px 8px 36px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
          </div>

          {/* TABLE CONTENT */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <th style={{ padding: '14px 20px' }}>Nama Siswa</th>
                  <th style={{ padding: '14px 16px' }}>Kelas</th>
                  <th style={{ padding: '14px 16px' }}>Jenis Pelanggaran</th>
                  <th style={{ padding: '14px 16px' }}>Poin</th>
                  <th style={{ padding: '14px 16px' }}>Petugas Pelapor</th>
                  <th style={{ padding: '14px 16px' }}>Tanggal</th>
                  <th style={{ padding: '14px 16px' }}>Keterangan</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #1e293b' }}>
                {dataGerbangFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                      Belum ada catatan pelanggaran siswa yang cocok/tersedia hari ini.
                    </td>
                  </tr>
                ) : (
                  dataGerbangFiltered.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e293b', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: '#f8fafc' }}>{item.nama}</td>
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        <span style={{ backgroundColor: '#1e293b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {item.kelas}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#fca5a5', fontWeight: '600' }}>{item.jenis || item.jenis_pelanggaran}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                          +{item.poin || 5} Pts
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {item.role_petugas || item.shift} {item.nama_petugas ? `(${item.nama_petugas})` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>{item.tanggal}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.keterangan || '-'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleHapusCatatan(item.id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
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
        </div>

      </main>

      {/* MODAL 1: FORM CATAT SISWA MELANGGAR */}
      {showModalInput && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(11, 15, 25, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#111827', padding: '28px', borderRadius: '18px', maxWidth: '480px', width: '90%', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '800' }}>⚠️ Catat Pelanggaran Gerbang</h3>
              <button onClick={() => setShowModalInput(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            
            <form onSubmit={handleSimpanPelanggaran}>
              
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Petugas Pelapor / Pencatat *
                </label>
                <select
                  value={selectedPetugasId}
                  onChange={(e) => setSelectedPetugasId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', fontWeight: '600' }}
                >
                  {listPetugas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.org})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Nama Siswa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Zen"
                    value={inputNamaSiswa}
                    onChange={(e) => setInputNamaSiswa(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="X RPL 1"
                    value={inputKelasSiswa}
                    onChange={(e) => setInputKelasSiswa(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Jenis Pelanggaran *</label>
                <select
                  value={inputJenisPelanggaran}
                  onChange={(e) => setInputJenisPelanggaran(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px' }}
                >
                  {MASTER_PELANGGARAN.map((m) => (
                    <option key={m.jenis} value={m.jenis}>
                      {m.jenis} (+{m.poin} Pts)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Catatan Detail / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Datang jam 07:20, sepatu berwarna putih..."
                  value={inputKeterangan}
                  onChange={(e) => setInputKeterangan(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModalInput(false)}
                  style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KELOLA TIM PETUGAS JAGA */}
      {showModalKelolaTim && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(11, 15, 25, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#111827', padding: '28px', borderRadius: '18px', maxWidth: '440px', width: '90%', border: '1px solid #334155' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '800' }}>👥 Kelola Tim Jaga Gerbang</h3>
              <button onClick={() => setShowModalKelolaTim(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            {/* FORM TAMBAH ANGGOTA */}
            <form onSubmit={handleTambahPetugas} style={{ marginBottom: '20px', backgroundColor: '#0b0f19', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                + Tambah Anggota OSIS / MPK
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '10px' }}>
                <select
                  value={inputOrgBaru}
                  onChange={(e) => setInputOrgBaru(e.target.value as 'OSIS' | 'MPK')}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#111827', color: '#fff', fontSize: '12px', fontWeight: '700' }}
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
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#111827', color: '#fff', fontSize: '12px' }}
                />
              </div>
              <button
                type="submit"
                style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Masukkan ke Tim Jaga
              </button>
            </form>

            {/* LIST ANGGOTA AKTIF */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daftar Petugas Aktif Jaga:</h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {listPetugas.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0f19', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ backgroundColor: p.org === 'OSIS' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(124, 58, 237, 0.2)', color: p.org === 'OSIS' ? '#38bdf8' : '#c084fc', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                      {p.org}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{p.nama}</span>
                  </div>
                  <button
                    onClick={() => handleHapusPetugas(p.id)}
                    style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
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
                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
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