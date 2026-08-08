'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Send, AlertTriangle } from 'lucide-react';

type MasterPelanggaranItem = {
  id?: number | string;
  nama_pelanggaran?: string;
  nama?: string;
  jenis_pelanggaran?: string;
  jenis?: string;
  kategori?: string;
  poin?: number | string;
};

// Daftar Master Pelanggaran Khusus Pemeriksaan Gerbang Sekolah
const GERBANG_MASTER_PELANGGARAN: MasterPelanggaranItem[] = [
  { id: 1, nama_pelanggaran: 'Terlambat masuk lebih dari 10 menit', kategori: 'Keterlambatan', poin: 5 },
  { id: 2, nama_pelanggaran: 'Datang di lingkungan sekolah tidak senonoh / tidak sesuai', kategori: 'Keterlambatan', poin: 10 },
  { id: 3, nama_pelanggaran: 'Tidak memasukkan pakaian / Baju dikeluarkan', kategori: 'Seragam', poin: 5 },
  { id: 4, nama_pelanggaran: 'Seragam tidak sesuai dengan ketentuan', kategori: 'Seragam', poin: 10 },
  { id: 5, nama_pelanggaran: 'Tidak bersepatu / kaos kaki / memakai kaos kaki selain putih', kategori: 'Seragam', poin: 10 },
  { id: 6, nama_pelanggaran: 'Seragam tidak lengkap', kategori: 'Seragam', poin: 10 },
  { id: 7, nama_pelanggaran: 'Memakai topi bebas / selain topi sekolah', kategori: 'Seragam', poin: 10 },
  { id: 8, nama_pelanggaran: 'Tidak memakai ikat pinggang / sabuk hitam', kategori: 'Seragam', poin: 5 },
  { id: 9, nama_pelanggaran: 'Memakai ikat pinggang berkepala besar', kategori: 'Seragam', poin: 10 },
  { id: 10, nama_pelanggaran: 'Memakai sweater / jaket di lingkungan sekolah', kategori: 'Seragam', poin: 10 },
  { id: 11, nama_pelanggaran: 'Berjilbab selain warna putih / abu-abu', kategori: 'Seragam', poin: 10 },
  { id: 12, nama_pelanggaran: 'Memakai gelang / kalung bagi laki-laki', kategori: 'Seragam', poin: 10 },
  { id: 13, nama_pelanggaran: 'Tidak memakai Badge Lokasi / Badge OSIS', kategori: 'Seragam', poin: 5 },
  { id: 14, nama_pelanggaran: 'Tidak memakai sepatu hitam', kategori: 'Seragam', poin: 10 },
  { id: 15, nama_pelanggaran: 'Tidak memakai kaos dalam', kategori: 'Seragam', poin: 5 },
  { id: 16, nama_pelanggaran: 'Siswa berhias / bersolek berlebihan', kategori: 'Kepribadian', poin: 5 },
  { id: 17, nama_pelanggaran: 'Siswa berambut gondrong', kategori: 'Kepribadian', poin: 20 },
  { id: 18, nama_pelanggaran: 'Siswa berambut dicat / dimode / nyentrik', kategori: 'Kepribadian', poin: 10 },
  { id: 19, nama_pelanggaran: 'Tidak ikut upacara / atribut tidak lengkap', kategori: 'Ketertiban', poin: 10 },
];

export default function OsisPage() {
  const today = new Date().toISOString().split('T')[0];

  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('');
  const [jamKejadian, setJamKejadian] = useState('07:15');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tindakan, setTindakan] = useState('Peringatan Lisan & Binaan OSIS');

  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [siswaByKelas, setSiswaByKelas] = useState<{ [kelas: string]: string[] }>({});

  const [masterPelanggaranList, setMasterPelanggaranList] = useState<MasterPelanggaranItem[]>(GERBANG_MASTER_PELANGGARAN);
  const [selectedPelanggaran, setSelectedPelanggaran] = useState<string>(GERBANG_MASTER_PELANGGARAN[0].nama_pelanggaran || '');
  const [selectedKategori, setSelectedKategori] = useState<string>(GERBANG_MASTER_PELANGGARAN[0].kategori || 'Keterlambatan');
  const [selectedPoin, setSelectedPoin] = useState<number>(Number(GERBANG_MASTER_PELANGGARAN[0].poin ?? 5));

  const [listPelanggaran, setListPelanggaran] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-fill Nama Petugas dan bersihkan format kelas dalam kurung pada nama sesi
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.nama) {
          const cleanName = session.nama.replace(/\s*\(.*?\)\s*/g, '').trim();
          setNamaPetugas(cleanName);
        }
      } catch (err) {}
    }
  }, []);

  // Fetch dan Parse CSV DATAMURIDPROYEK.csv secara lengkap dan terurut
  useEffect(() => {
    fetch('/DATAMURIDPROYEK.csv')
      .then((res) => {
        if (!res.ok) throw new Error('File CSV tidak ditemukan di folder public');
        return res.text();
      })
      .then((csvText) => {
        const lines = csvText.split(/\r?\n/);
        const mapSiswa: { [kelas: string]: string[] } = {};
        const kelasSet = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(';');
          if (parts.length >= 6) {
            const nama = parts[4]?.trim();
            const kls = parts[5]?.trim();

            if (kls && nama && kls !== 'XII') {
              kelasSet.add(kls);
              if (!mapSiswa[kls]) mapSiswa[kls] = [];
              if (!mapSiswa[kls].includes(nama)) {
                mapSiswa[kls].push(nama);
              }
            }
          }
        }

        const sortedKelas = Array.from(kelasSet).sort((a, b) => {
          const order: { [key: string]: number } = { 'X': 1, 'XI': 2, 'XII': 3 };
          const prefixA = a.split('.')[0];
          const prefixB = b.split('.')[0];
          const levelA = order[prefixA] || 99;
          const levelB = order[prefixB] || 99;
          if (levelA !== levelB) return levelA - levelB;
          return a.localeCompare(b, 'id', { numeric: true });
        });

        Object.keys(mapSiswa).forEach((kls) => {
          mapSiswa[kls].sort((a, b) => a.localeCompare(b, 'id'));
        });

        setKelasOptions(sortedKelas);
        setSiswaByKelas(mapSiswa);

        if (sortedKelas.length > 0) {
          setKelas(sortedKelas[0]);
          if (mapSiswa[sortedKelas[0]] && mapSiswa[sortedKelas[0]].length > 0) {
            setNamaSiswa(mapSiswa[sortedKelas[0]][0]);
          }
        }
      })
      .catch((err) => {
        console.error('Gagal memuat DATAMURIDPROYEK.csv:', err);
      });
  }, []);

  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    const listSiswaKelas = siswaByKelas[newKelas] || [];
    if (listSiswaKelas.length > 0) {
      setNamaSiswa(listSiswaKelas[0]);
    } else {
      setNamaSiswa('');
    }
  };

  const fetchPelanggaranSiswa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setListPelanggaran(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPelanggaranSiswa();
  }, []);

  const handleSelectPelanggaranChange = (namaPelanggaran: string) => {
    setSelectedPelanggaran(namaPelanggaran);
    const found = masterPelanggaranList.find((item) => {
      const nama = item.nama_pelanggaran || item.nama || item.jenis_pelanggaran;
      return nama === namaPelanggaran;
    });

    if (found) {
      setSelectedKategori(found.kategori || 'Keterlambatan');
      setSelectedPoin(Number(found.poin ?? 5));
    }
  };

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

      setKeterangan('');
      fetchPelanggaranSiswa();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        message: err.message || 'Gagal menyimpan data pelanggaran.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = listPelanggaran.filter(
    (item) =>
      item.nama_siswa?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.jenis_pelanggaran?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.pencatat?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body, html {
          background-color: #021f18 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow-x: hidden !important;
        }
      ` }} />
      {/* DIPERBAIKI: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR DENGAN LATAR BELAKANG HIJAU GELAP MENYATU */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR GRADASI HIJAU GELAP ELEGAN */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#34d399" />
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Panel Kedisiplinan OSIS & MPK (Pemeriksaan Gerbang)[cite: 12]
                </h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Pencatatan Kedisiplinan & Atribut Siswa di Gerbang Sekolah[cite: 12]</span>
              </div>
            </div>
            <button onClick={() => { fetchPelanggaranSiswa(); }} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '9px 16px', borderRadius: '8px', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
              <RefreshCw size={14} color="#34d399" />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* MAIN CONTENT - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {statusMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: '700', fontSize: '13px', backgroundColor: statusMsg.type === 'success' ? '#064e3b' : '#7f1d1d', color: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#f87171'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box' }}>
                {statusMsg.type === 'success' ? '✅ ' : '⚠️ '} {statusMsg.message}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
              
              {/* FORM CATAT PELANGGARAN SISWA */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#34d399" />
                  Form Input Pemeriksaan Gerbang[cite: 12]
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* PILIH KELAS & NAMA SISWA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Kelas & Jurusan
                      </label>
                      <select
                        value={kelas}
                        onChange={(e) => handleKelasChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      >
                        {kelasOptions.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Nama Siswa Melanggar
                      </label>
                      <select
                        value={namaSiswa}
                        onChange={(e) => setNamaSiswa(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      >
                        {(siswaByKelas[kelas] || []).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* JAM KEJADIAN & PETUGAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Jam Tiba / Kejadian
                      </label>
                      <input
                        type="text"
                        required
                        value={jamKejadian}
                        onChange={(e) => setJamKejadian(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                        Nama Petugas OSIS
                      </label>
                      <input
                        type="text"
                        required
                        value={namaPetugas}
                        onChange={(e) => setNamaPetugas(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#021f18', color: '#fff' }}
                      />
                    </div>
                  </div>

                  {/* DROPDOWN PELANGGARAN GERBANG */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Pilih Jenis Pelanggaran Gerbang
                    </label>
                    <select
                      value={selectedPelanggaran}
                      onChange={(e) => handleSelectPelanggaranChange(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', outline: 'none', backgroundColor: '#021f18', color: '#a7f3d0', fontWeight: '700', boxSizing: 'border-box' }}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(248, 113, 113, 0.4)', padding: '10px 14px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '700', display: 'block' }}>Kategori: {selectedKategori}</span>
                      <span style={{ fontSize: '12px', color: '#fee2e2', fontWeight: '700' }}>Poin Yang Akan Ditambahkan:</span>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#f87171', backgroundColor: '#021f18', padding: '2px 10px', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.4)' }}>
                      +{selectedPoin} POIN
                    </span>
                  </div>

                  {/* KETERANGAN */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Keterangan / Detail Kejadian
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Tidak memakai kaos kaki putih / rambut dicat..."
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  {/* SANKSI */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Tindakan / Sanksi OSIS & MPK
                    </label>
                    <select
                      value={tindakan}
                      onChange={(e) => setTindakan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', outline: 'none', backgroundColor: '#021f18', color: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="Peringatan Lisan & Binaan OSIS">Peringatan Lisan & Binaan OSIS</option>
                      <option value="Penyitaan Atribut / Barang Pelanggaran">Penyitaan Atribut / Barang Pelanggaran</option>
                      <option value="Bersih-bersih Lingkungan Sekolah">Bersih-bersih Lingkungan Sekolah</option>
                      <option value="Diserahkan ke Guru Piket / BK">Diserahkan ke Guru Piket / BK</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Pelanggaran'}</span>
                  </button>
                </form>
              </div>

              {/* TABEL / REKAP PELANGGARAN SISWA */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '700' }}>
                      Rekap Pelanggaran Siswa[cite: 12]
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#a7f3d0' }}>Total: {filteredData.length} Kasus[cite: 12]</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama, kelas, jenis pelanggaran, atau petugas..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Memuat data...</p>
                ) : filteredData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '40px 0' }}>Belum ada pelanggaran yang dicatat.[cite: 12]</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
                    {filteredData.map((item) => (
                      <div key={item.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#021f18', borderLeft: '4px solid #34d399', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{item.nama_siswa}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#064e3b', color: '#a7f3d0', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                              {item.kelas}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#451a03', color: '#f87171', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                              +{item.poin ?? 5} Poin[cite: 12]
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fca5a5', marginTop: '6px' }}>
                          ⚠️ {item.jenis_pelanggaran}
                        </div>

                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          <strong>Waktu:</strong> {item.jam_kejadian} WIB ({item.tanggal})[cite: 12]
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          <strong>Detail:</strong> {item.keterangan || '-'}[cite: 12]
                        </div>
                        <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px', fontWeight: '700' }}>
                          Sanksi: {item.tindakan}
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', textAlign: 'right', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                          Petugas: <span style={{ color: '#34d399' }}>{item.pencatat || 'Pengurus OSIS & MPK'}</span>[cite: 12]
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Kedisiplinan OSIS & MPK MindGuard - SMK Budi Bakti Ciwidey[cite: 12]
          </footer>
        </div>
      </div>
    </>
  );
}