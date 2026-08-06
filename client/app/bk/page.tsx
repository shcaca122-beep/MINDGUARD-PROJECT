'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/lib/swal';

// MASTER DAFTAR KELAS RESMI SMK BUDI BAKTI CIWIDEY
const DAFTAR_KELAS_BK = [
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

// PRESET PELANGGARAN SESUAI PERATURAN RESMI SMK BUDI BAKTI CIWIDEY (NO: 499/188.3-SMK.BBC/VII/2024)
const PRESET_PELANGGARAN_GERBANG = [
  // KELENGKAPAN SERAGAM & GERBANG
  { label: '👔 Baju / Seragam tidak dimasukkan', poin: 5 },
  { label: '🏷️ Tidak memakai Badge Lokasi / Badge OSIS / Kaos Kaki Putih', poin: 5 },
  { label: '👟 Tidak memakai sepatu hitam / Kaos dalam', poin: 10 },
  { label: '🧢 Memakai topi bebas di lingkungan sekolah (Topi Disita)', poin: 10 },
  { label: '👖 Celana / Rok tidak sesuai ketentuan / Celana tidak dijahit bawah', poin: 10 },
  { label: '🥋 Tidak memakai ikat pinggang / Ikat pinggang berkepala besar', poin: 10 },
  { label: '🧥 Memakai sweater/jaket di lingkungan sekolah (Disita)', poin: 10 },
  { label: '🧕 Berjilbab selain warna putih/abu-abu', poin: 10 },
  { label: '💍 Gelang/Kalung bagi laki-laki (Disita)', poin: 10 },
  { label: '👖 Memakai Jeans di sekolah (Disita)', poin: 15 },
  { label: '💍 Putera memakai anting/kalung / Puteri memakai rok mini', poin: 20 },

  // KETERLAMBATAN & KEHADIRAN
  { label: '⏰ Terlambat masuk lebih dari 10 menit (3x = Panggilan Ortu)', poin: 5 },
  { label: '🚶 Datang di lingkungan sekolah tidak seragam', poin: 10 },
  { label: '❌ Keterangan Alfa / Tanpa Keterangan', poin: 10 },
  { label: '🕌 Tidak mengikuti Dhuha/Tadarrusan/Tidak bawa Al-Qur\'an', poin: 10 },
  { label: '🏃 Meninggalkan kelas tanpa keterangan (Bolos)', poin: 15 },
  { label: '📝 Tidak masuk dengan keterangan palsu (Perjanjian Bermaterai)', poin: 25 },
  { label: '🚪 Izin keluar & tidak kembali ke sekolah (Minggat)', poin: 30 },

  // KEPRIBADIAN & KETERTIBAN
  { label: '💄 Berhias/bersolek berlebihan', poin: 5 },
  { label: '💇 Rambut dicat / dimode / nyentrik (Dirapikan)', poin: 10 },
  { label: '🧔 Siswa berjenggot (Langsung dicukur)', poin: 10 },
  { label: '💇 Siswa rambut gondrong (Langsung dipotong)', poin: 20 },
  { label: '🧗 Melompati pagar sekolah (Perjanjian Bermaterai)', poin: 50 },

  // MEROKOK & ATURAN TAMBAHAN
  { label: '🔥 Membawa korek api / korek gas', poin: 20 },
  { label: '📱 Membawa Handphone Tanpa Izin/Perintah Guru (1X - Panggilan Ortu)', poin: 25 },
  { label: '🚬 Merokok / Membawa rokok di luar lingkungan sekolah', poin: 50 },
  { label: '📱 Membawa Handphone Tanpa Izin/Perintah Guru (2X - HP Disita Tidak Dikembalikan)', poin: 50 },
  { label: '🚬 Merokok di lingkungan sekolah', poin: 100 },

  // PELANGGARAN BERAT (BERHENTI / DO / 100 POIN)
  { label: '🥊 Perkelahian sesama teman / Tawuran', poin: 100 },
  { label: '💸 Memalak / Meminta uang dengan paksa', poin: 100 },
  { label: '🔪 Membawa senjata tajam / senjata api', poin: 100 },
  { label: '🍷 Membawa / Menggunakan NARKOBA / Minuman Keras', poin: 100 },
  { label: '🗣️ Melawan Guru, Karyawan, atau Mencemarkan Nama Baik Sekolah', poin: 100 },
];

export default function DashboardBK() {
  // STATE PENAMPUNG DATA LOCALSTORAGE & SUPABASE
  const [dataPelanggaranLocal, setDataPelanggaranLocal] = useState<any[]>([]);

  // STATE UNTUK MODAL PREVIEW FOTO SURAT IZIN/SAKIT
  const [selectedFotoPreview, setSelectedFotoPreview] = useState<string | null>(null);

  // STATE UNTUK PENCARIAN PELANGGARAN DI MODAL GERBANG
  const [searchPelanggaran, setSearchPelanggaran] = useState('');

  // STATE NAMA GURU BK / PETUGAS
  const [namaGuru, setNamaGuru] = useState<string>('');
  const [showModalNama, setShowModalNama] = useState<boolean>(false);
  const [tempNamaGuru, setTempNamaGuru] = useState<string>('');

  // STATE TAB MENU
  const [tabBK, setTabBK] = useState<
    'curhat' | 'konseling_ind' | 'bimbingan_kelompok' | 'bimbingan_klasikal' | 'home_visit' | 'panggilan_ortu' | 'perizinan' | 'pelanggaran' | 'kinerja_bk'
  >('curhat');

  // STATE DATA SUPABASE
  const [dataCurhat, setDataCurhat] = useState<any[]>([]);
  const [dataKonselingInd, setDataKonselingInd] = useState<any[]>([]);
  const [dataBimbinganKelompok, setDataBimbinganKelompok] = useState<any[]>([]);
  const [dataBimbinganKlasikal, setDataBimbinganKlasikal] = useState<any[]>([]);
  const [dataHomeVisit, setDataHomeVisit] = useState<any[]>([]);
  const [dataPanggilanOrtu, setDataPanggilanOrtu] = useState<any[]>([]);
  const [dataIzin, setDataIzin] = useState<any[]>([]);
  const [dataLogPelanggaran, setDataLogPelanggaran] = useState<any[]>([]);

  // VIEW MODE UNTUK TAB PELANGGARAN
  const [viewPelanggaranMode, setViewPelanggaranMode] = useState<'rekap' | 'log_detail'>('rekap');

  // FILTER LAPORAN KINERJA BK
  const [tipeLaporanKinerja, setTipeLaporanKinerja] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [bulanKinerja, setBulanKinerja] = useState<string>('08');
  const [tahunKinerja, setTahunKinerja] = useState<string>('2026');

  // MODAL STATES FOR INPUT DATA
  const [showModalAddKelompok, setShowModalAddKelompok] = useState(false);
  const [formKelompok, setFormKelompok] = useState({ kelas: DAFTAR_KELAS_BK[0], topik: '', anggota: '', tanggal: new Date().toISOString().split('T')[0] });

  const [showModalAddKlasikal, setShowModalAddKlasikal] = useState(false);
  const [formKlasikal, setFormKlasikal] = useState({ kelas: DAFTAR_KELAS_BK[0], materi: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0] });

  // MODAL STATE UNTUK INPUT PELANGGARAN
  const [showModalAddPelanggaran, setShowModalAddPelanggaran] = useState(false);
  const [formPelanggaran, setFormPelanggaran] = useState({
    nama: '',
    kelas: DAFTAR_KELAS_BK[0],
    jenis_pelanggaran: PRESET_PELANGGARAN_GERBANG[0].label,
    poin: PRESET_PELANGGARAN_GERBANG[0].poin,
    role_petugas: 'OSIS & MPK',
    nama_petugas: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // HOOK INISIALISASI DATA & REALTIME LISTENERS
  useEffect(() => {
    const savedNama = localStorage.getItem('mindguard_nama_guru');
    if (savedNama) {
      setNamaGuru(savedNama);
    } else {
      setShowModalNama(true);
    }

    const loadDataLocal = () => {
      const saved = localStorage.getItem('mindguard_pelanggaran');
      if (saved) {
        try {
          setDataPelanggaranLocal(JSON.parse(saved));
        } catch (e) {
          console.error('Gagal membaca data pelanggaran local:', e);
        }
      }
    };

    loadDataLocal();
    fetchAllData();

    window.addEventListener('storage', loadDataLocal);
    window.addEventListener('update_pelanggaran', loadDataLocal);
    window.addEventListener('update_perizinan', fetchAllData);

    return () => {
      window.removeEventListener('storage', loadDataLocal);
      window.removeEventListener('update_pelanggaran', loadDataLocal);
      window.removeEventListener('update_perizinan', fetchAllData);
    };
  }, []);

  // 🔄 GABUNGAN RIWAYAT LOG PELANGGARAN (SUPABASE + LOCALSTORAGE OSIS/MPK)
  const combinedLogPelanggaran = sortBerurutanKelas([...dataLogPelanggaran, ...dataPelanggaranLocal]);

  // 📊 AKUMULASI OTOMATIS POIN KREDIT PER SISWA
  const rekapPoinSiswa = combinedLogPelanggaran.reduce((acc: any[], item: any) => {
    const namaSiswa = item.nama || '';
    const kelasSiswa = item.kelas || '';

    const existing = acc.find(
      (s) => s.nama.toLowerCase() === namaSiswa.toLowerCase() && s.kelas.toLowerCase() === kelasSiswa.toLowerCase()
    );

    const poin = Number(item.poin || item.poin_pelanggaran) || 5;

    if (existing) {
      existing.totalPoin += poin;
      existing.jumlahKejadian += 1;
    } else {
      acc.push({
        id: item.id || Math.random().toString(),
        nama: namaSiswa,
        kelas: kelasSiswa,
        totalPoin: poin,
        jumlahKejadian: 1,
      });
    }
    return acc;
  }, []);

  // FUNGSI HELPER PENENTU STATUS SANKSI SESUAI DOKUMEN SMKBBC NO: 499/188.3-SMK.BBC/VII/2024
  const getStatusPoin = (poin: number) => {
    if (poin >= 100) {
      return { label: 'Kategori IV: Dikembalikan Ke Ortu / BERHENTI (DO)', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
    }
    if (poin >= 75) {
      return { label: 'Kategori IV: SP Terakhir / Dikembalikan Sementara', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
    }
    if (poin >= 50) {
      return { label: 'Kategori III: Perjanjian Bermaterai II & Panggilan Ortu II', bg: '#fffbe3', color: '#b45309', border: '#fde047' };
    }
    if (poin >= 25) {
      return { label: 'Kategori II: Perjanjian Bermaterai I & Panggilan Ortu I', bg: '#fefce8', color: '#854d0e', border: '#fef08a' };
    }
    return { label: 'Kategori I: Teguran Lisan / Bimbingan BP', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
  };

  const handleSimpanNamaGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNamaGuru.trim()) {
      showError('Gagal', 'Nama Petugas tidak boleh kosong!');
      return;
    }
    setNamaGuru(tempNamaGuru);
    localStorage.setItem('mindguard_nama_guru', tempNamaGuru);
    setShowModalNama(false);
    showSuccess('Selamat Datang!', `Sistem siap digunakan oleh ${tempNamaGuru}`);
  };

  function sortBerurutanKelas(array: any[]) {
    return [...array].sort((a, b) => {
      const kelasA = (a.kelas || '').toUpperCase();
      const kelasB = (b.kelas || '').toUpperCase();
      if (kelasA !== kelasB) {
        return kelasA.localeCompare(kelasB, undefined, { numeric: true, sensitivity: 'base' });
      }
      return (a.nama || a.materi || a.topik || '').localeCompare(b.nama || b.materi || b.topik || '');
    });
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchCurhat(),
      fetchKonseling(),
      fetchBimbinganKelompok(),
      fetchBimbinganKlasikal(),
      fetchHomeVisit(),
      fetchPanggilanOrtu(),
      fetchPerizinan(),
      fetchPelanggaran(),
    ]);
  };

  const fetchCurhat = async () => {
    const { data } = await supabase.from('curhat_anonim').select('*').order('created_at', { ascending: false });
    if (data) setDataCurhat(data);
  };

  const fetchKonseling = async () => {
    const { data } = await supabase.from('konseling_individual').select('*').order('created_at', { ascending: false });
    if (data) setDataKonselingInd(sortBerurutanKelas(data));
  };

  const fetchBimbinganKelompok = async () => {
    const { data } = await supabase.from('bimbingan_kelompok').select('*').order('created_at', { ascending: false });
    if (data) setDataBimbinganKelompok(sortBerurutanKelas(data));
  };

  const fetchBimbinganKlasikal = async () => {
    const { data } = await supabase.from('bimbingan_klasikal').select('*').order('created_at', { ascending: false });
    if (data) setDataBimbinganKlasikal(sortBerurutanKelas(data));
  };

  const fetchHomeVisit = async () => {
    const { data } = await supabase.from('home_visit').select('*').order('created_at', { ascending: false });
    if (data) setDataHomeVisit(sortBerurutanKelas(data));
  };

  const fetchPanggilanOrtu = async () => {
    const { data } = await supabase.from('panggilan_ortu').select('*').order('created_at', { ascending: false });
    if (data) setDataPanggilanOrtu(sortBerurutanKelas(data));
  };

  const fetchPerizinan = async () => {
    const { data } = await supabase.from('perizinan').select('*').order('created_at', { ascending: false });
    if (data) setDataIzin(sortBerurutanKelas(data));
  };

  const fetchPelanggaran = async () => {
    const { data } = await supabase.from('pelanggaran').select('*').order('created_at', { ascending: false });
    if (data) {
      setDataLogPelanggaran(sortBerurutanKelas(data));
    }
  };

  const getFilteredKinerjaBK = () => {
    const semuaAktivitas = [
      ...dataKonselingInd.map(i => ({ ...i, jenisAktivitas: 'Konseling Individual', detail: i.topik })),
      ...dataBimbinganKelompok.map(i => ({ ...i, nama: i.anggota, jenisAktivitas: 'Bimbingan Kelompok', detail: i.topik })),
      ...dataBimbinganKlasikal.map(i => ({ ...i, nama: 'Satu Kelas', jenisAktivitas: 'Bimbingan Klasikal', detail: i.materi })),
      ...dataHomeVisit.map(i => ({ ...i, jenisAktivitas: 'Home Visit', detail: i.alasan })),
      ...dataPanggilanOrtu.map(i => ({ ...i, jenisAktivitas: 'Pemanggilan Ortu', detail: i.alasan })),
      ...dataIzin.map(i => ({ ...i, jenisAktivitas: `Izin (${i.jenis})`, detail: i.keterangan })),
      ...combinedLogPelanggaran.map(i => ({ ...i, jenisAktivitas: `Pelanggaran (${i.role_petugas || 'Piket Gerbang'})`, detail: `${i.jenis_pelanggaran || i.jenis} (+${i.poin} Poin)` })),
    ];

    return sortBerurutanKelas(semuaAktivitas.filter(item => {
      if (!item.tanggal) return false;
      const tgl = new Date(item.tanggal);
      const itemBulan = String(tgl.getMonth() + 1).padStart(2, '0');
      const itemTahun = String(tgl.getFullYear());

      if (tipeLaporanKinerja === 'bulanan' && (itemBulan !== bulanKinerja || itemTahun !== tahunKinerja)) return false;
      if (tipeLaporanKinerja === 'tahunan' && itemTahun !== tahunKinerja) return false;

      return true;
    }));
  };

  const handleSimpanPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPelanggaran.nama.trim()) {
      showError('Gagal Simpan', 'Nama Siswa yang melanggar wajib diisi!');
      return;
    }

    const payload = {
      nama: formPelanggaran.nama.trim(),
      kelas: formPelanggaran.kelas,
      jenis_pelanggaran: formPelanggaran.jenis_pelanggaran,
      poin: Number(formPelanggaran.poin),
      role_petugas: formPelanggaran.role_petugas,
      nama_petugas: formPelanggaran.nama_petugas || namaGuru || 'Petugas Piket Gerbang',
      tanggal: formPelanggaran.tanggal,
    };

    const { error } = await supabase.from('pelanggaran').insert([payload]);

    if (error) {
      console.error('Error Supabase:', error);
      showError('Gagal Simpan Database', error.message);
    } else {
      const existingLocal = JSON.parse(localStorage.getItem('mindguard_pelanggaran') || '[]');
      const newEntry = { ...payload, id: Date.now().toString(), jenis: formPelanggaran.jenis_pelanggaran, shift: formPelanggaran.role_petugas };
      localStorage.setItem('mindguard_pelanggaran', JSON.stringify([newEntry, ...existingLocal]));
      window.dispatchEvent(new Event('update_pelanggaran'));

      showSuccess('Pelanggaran Dicatat!', `Poin pelanggaran siswa ${formPelanggaran.nama} berhasil tersimpan ke database (+${formPelanggaran.poin} Poin).`);
      
      await fetchPelanggaran();
      setShowModalAddPelanggaran(false);
      setSearchPelanggaran('');
      setFormPelanggaran({
        nama: '',
        kelas: DAFTAR_KELAS_BK[0],
        jenis_pelanggaran: PRESET_PELANGGARAN_GERBANG[0].label,
        poin: PRESET_PELANGGARAN_GERBANG[0].poin,
        role_petugas: 'OSIS & MPK',
        nama_petugas: '',
        tanggal: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleSimpanKelompok = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bimbingan_kelompok').insert([{ ...formKelompok, status: 'SELESAI' }]);
    if (error) {
      showError('Gagal Menyimpan', error.message);
    } else {
      showSuccess('Berhasil Disimpan!', 'Data Bimbingan Kelompok telah dicatat.');
      await fetchBimbinganKelompok();
      setShowModalAddKelompok(false);
      setFormKelompok({ kelas: DAFTAR_KELAS_BK[0], topik: '', anggota: '', tanggal: new Date().toISOString().split('T')[0] });
    }
  };

  const handleSimpanKlasikal = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bimbingan_klasikal').insert([formKlasikal]);
    if (error) {
      showError('Gagal Menyimpan', error.message);
    } else {
      showSuccess('Berhasil Disimpan!', 'Catatan Bimbingan Klasikal telah disimpan.');
      await fetchBimbinganKlasikal();
      setShowModalAddKlasikal(false);
      setFormKlasikal({ kelas: DAFTAR_KELAS_BK[0], materi: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937' }}>
      
      {/* NAVBAR */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>MindGuard - SMK Budi Bakti Ciwidey</div>
            <span style={{ fontSize: '11px', backgroundColor: '#2d523e', padding: '3px 8px', borderRadius: '12px', color: '#a7f3d0' }}>
              Sistem Layanan BK & Kedisiplinan OSIS/MPK
            </span>
          </div>
        </div>

        {/* IDENTITAS GURU BK / PETUGAS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>
              👋 {namaGuru || 'Guru BK / Petugas'}
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Akses Layanan Ketertiban</div>
          </div>

          <button
            onClick={() => {
              setTempNamaGuru(namaGuru);
              setShowModalNama(true);
            }}
            style={{ backgroundColor: '#2d523e', color: '#a7f3d0', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✏️ Ganti Profil
          </button>

          <button onClick={fetchAllData} style={{ backgroundColor: '#ffffff', color: '#1b3b2b', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔄 Refresh
          </button>
        </div>
      </nav>

      {/* CONTAINER UTAMA */}
      <main style={{ maxWidth: '1280px', margin: '24px auto', padding: '0 20px' }}>
        
        {/* KARTU STATISTIK SEJAJAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>💬 CURHAT ANONIM</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#1b3b2b' }}>{dataCurhat.length} Pesan</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>👤 KONSELING IND.</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#1b3b2b' }}>{dataKonselingInd.length} Sesi</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'bold' }}>👥 BIMB. KELOMPOK</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#1b3b2b' }}>{dataBimbinganKelompok.length} Sesi</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 'bold' }}>🏫 BIMB. KLASIKAL</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#1b3b2b' }}>{dataBimbinganKlasikal.length} Sesi</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #b5d8b6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>🚨 PELANGGARAN GERBANG</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#991b1b' }}>{combinedLogPelanggaran.length} Catatan</div>
          </div>
        </div>

        {/* TAB NAVIGATION 9 MENU */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'curhat', label: '💬 Curhat Anonim' },
            { id: 'konseling_ind', label: '👤 Konseling Indv.' },
            { id: 'bimbingan_kelompok', label: '👥 Bimbingan Kelompok' },
            { id: 'bimbingan_klasikal', label: '🏫 Bimbingan Klasikal' },
            { id: 'home_visit', label: '🏠 Home Visit' },
            { id: 'panggilan_ortu', label: '📞 Panggilan Ortu' },
            { id: 'perizinan', label: '🏥 Izin & Sakit' },
            { id: 'pelanggaran', label: '🚨 Pelanggaran & OSIS/MPK' },
            { id: 'kinerja_bk', label: '📊 Laporan Kinerja' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabBK(tab.id as any)}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: tabBK === tab.id ? 'none' : '1px solid #b5d8b6',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: tabBK === tab.id ? '#1b3b2b' : '#ffffff',
                color: tabBK === tab.id ? '#ffffff' : '#1b3b2b',
                boxShadow: tabBK === tab.id ? '0 4px 6px rgba(27, 59, 43, 0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* AREA KONTEN TAB */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #b5d8b6', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          
          {/* TAB 1: CURHAT ANONIM */}
          {tabBK === 'curhat' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>💬 Pesan Curhat Anonim</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>🔒 Kerahasiaan Sesi</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '2px' }}>Identitas Siswa Disamarkan</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>⏱️ Respon Konselor</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginTop: '2px' }}>Maksimal 1 x 24 Jam</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Judul Pesan</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tujuan Konselor</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Status Response</th>
                  </tr>
                </thead>
                <tbody>
                  {dataCurhat.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada pesan curhat anonim.</td></tr>
                  ) : (
                    dataCurhat.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{c.judul}</td>
                        <td style={{ padding: '12px 10px' }}>{c.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{c.jenis}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                            {c.status || 'TERKIRIM'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: KONSELING INDIVIDUAL */}
          {tabBK === 'konseling_ind' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>👤 Sesi Konseling Individual</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal Janji Temu</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Topik Bahasan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataKonselingInd.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada sesi konseling.</td></tr>
                  ) : (
                    dataKonselingInd.map((k) => (
                      <tr key={k.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{k.kelas}</td>
                        <td style={{ padding: '12px 10px' }}>{k.nama}</td>
                        <td style={{ padding: '12px 10px' }}>{k.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{k.topik}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: BIMBINGAN KELOMPOK */}
          {tabBK === 'bimbingan_kelompok' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>👥 Sesi Bimbingan Kelompok</h3>
                <button onClick={() => setShowModalAddKelompok(true)} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Input Bimbingan Kelompok
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Topik Bahasan</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Anggota Kelompok</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataBimbinganKelompok.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada data Bimbingan Kelompok.</td></tr>
                  ) : (
                    dataBimbinganKelompok.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{item.kelas}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{item.topik}</td>
                        <td style={{ padding: '12px 10px' }}>{item.anggota}</td>
                        <td style={{ padding: '12px 10px' }}>{item.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                            {item.status || 'SELESAI'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: BIMBINGAN KLASIKAL */}
          {tabBK === 'bimbingan_klasikal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>🏫 Bimbingan Klasikal (Tatap Muka Kelas)</h3>
                <button onClick={() => setShowModalAddKlasikal(true)} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Input Bimbingan Klasikal
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Materi Pembelajaran BK</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal Pelaksanaan</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataBimbinganKlasikal.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada catatan Bimbingan Klasikal.</td></tr>
                  ) : (
                    dataBimbinganKlasikal.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{item.kelas}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{item.materi}</td>
                        <td style={{ padding: '12px 10px' }}>{item.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{item.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: HOME VISIT */}
          {tabBK === 'home_visit' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>🏠 Agenda Kunjungan Rumah (Home Visit)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal Agenda</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Alasan Kunjungan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHomeVisit.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada agenda Home Visit.</td></tr>
                  ) : (
                    dataHomeVisit.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{h.kelas}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{h.nama}</td>
                        <td style={{ padding: '12px 10px' }}>{h.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{h.alasan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: PANGGILAN ORTU */}
          {tabBK === 'panggilan_ortu' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>📞 Pemanggilan Orang Tua / Wali Siswa</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal Panggilan</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Alasan Pemanggilan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPanggilanOrtu.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada catatan pemanggilan orang tua.</td></tr>
                  ) : (
                    dataPanggilanOrtu.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{p.kelas}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{p.nama}</td>
                        <td style={{ padding: '12px 10px' }}>{p.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{p.alasan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: PERIZINAN & DOKUMEN FOTO */}
          {tabBK === 'perizinan' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>🏥 Surat Izin / Dispensasi / Sakit Siswa</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Jenis Izin</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Keterangan</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderRadius: '0 6px 6px 0' }}>Lampiran Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {dataIzin.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada catatan perizinan siswa.</td></tr>
                  ) : (
                    dataIzin.map((iz) => (
                      <tr key={iz.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{iz.kelas}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{iz.nama}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                            {iz.jenis}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{iz.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>{iz.keterangan}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          {/* 📷 TOMBOL LIHAT FOTO SURAT */}
                          {iz.foto_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedFotoPreview(iz.foto_url)}
                              style={{
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.15)'
                              }}
                            >
                              📷 Lihat Surat
                            </button>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}>Tanpa Foto</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 8: PELANGGARAN & OSIS/MPK */}
          {tabBK === 'pelanggaran' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#991b1b', fontSize: '17px' }}>🚨 Rekap Pelanggaran & Kedisiplinan Siswa</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Integrasi Laporan Piket Gerbang OSIS, MPK & Guru BK</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setViewPelanggaranMode('rekap')}
                      style={{
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: viewPelanggaranMode === 'rekap' ? '#ffffff' : 'transparent',
                        color: viewPelanggaranMode === 'rekap' ? '#1b3b2b' : '#6b7280',
                        boxShadow: viewPelanggaranMode === 'rekap' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      📊 Rekap Poin Siswa ({rekapPoinSiswa.length})
                    </button>
                    <button
                      onClick={() => setViewPelanggaranMode('log_detail')}
                      style={{
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: viewPelanggaranMode === 'log_detail' ? '#ffffff' : 'transparent',
                        color: viewPelanggaranMode === 'log_detail' ? '#1b3b2b' : '#6b7280',
                        boxShadow: viewPelanggaranMode === 'log_detail' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      📜 Riwayat Kejadian (Log) ({combinedLogPelanggaran.length})
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSearchPelanggaran('');
                      setShowModalAddPelanggaran(true);
                    }}
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ➕ Input Pelanggaran Gerbang
                  </button>
                </div>
              </div>

              {/* TAMPILAN REKAP TOTAL POIN SISWA */}
              {viewPelanggaranMode === 'rekap' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#991b1b', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Kelas</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Total Akumulasi Poin</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Status Kategori & Sanksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapPoinSiswa.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada data akumulasi pelanggaran siswa.</td></tr>
                    ) : (
                      rekapPoinSiswa.map((s) => {
                        const st = getStatusPoin(s.totalPoin);
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{s.kelas}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{s.nama}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                              <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                                {s.totalPoin} Poin ({s.jumlahKejadian}x Kejadian)
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block' }}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* TAMPILAN RIWAYAT LOG DETAILED */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Tanggal</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Kelas</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Jenis Pelanggaran</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Poin</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Petugas Input</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedLogPelanggaran.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada log catatan pelanggaran.</td></tr>
                    ) : (
                      combinedLogPelanggaran.map((l, idx) => (
                        <tr key={l.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 10px', fontSize: '11px', color: '#6b7280' }}>{l.tanggal}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{l.kelas}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{l.nama}</td>
                          <td style={{ padding: '12px 10px' }}>{l.jenis_pelanggaran || l.jenis}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>+{l.poin || l.poin_pelanggaran}</td>
                          <td style={{ padding: '12px 10px', fontSize: '11px' }}>
                            <span style={{ backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                              {l.role_petugas || l.shift || 'OSIS/MPK'}: {l.nama_petugas || '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 9: LAPORAN KINERJA BK */}
          {tabBK === 'kinerja_bk' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>📊 Laporan Rekapitulasi Kinerja Guru BK</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Data Gabungan Layanan BK dan Tindakan Kedisiplinan</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={tipeLaporanKinerja}
                    onChange={(e) => setTipeLaporanKinerja(e.target.value as any)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    <option value="bulanan">Laporan Bulanan</option>
                    <option value="tahunan">Laporan Tahunan</option>
                  </select>

                  {tipeLaporanKinerja === 'bulanan' && (
                    <select
                      value={bulanKinerja}
                      onChange={(e) => setBulanKinerja(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                    >
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  )}

                  <select
                    value={tahunKinerja}
                    onChange={(e) => setTahunKinerja(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Tanggal</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Jenis Layanan BK / Tindakan</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Kelas</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Nama Siswa / Sasaran</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderRadius: '0 6px 6px 0' }}>Detail Keterangan / Bahasan</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredKinerjaBK().length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Tidak ada rekam aktivitas untuk periode yang dipilih.</td></tr>
                  ) : (
                    getFilteredKinerjaBK().map((act, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 10px', fontSize: '11px', color: '#6b7280' }}>{act.tanggal}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                            {act.jenisAktivitas}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1b3b2b' }}>{act.kelas || '-'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{act.nama || '-'}</td>
                        <td style={{ padding: '12px 10px' }}>{act.detail || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* MODAL SET NAMA PETUGAS */}
      {showModalNama && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b', fontSize: '18px' }}>👤 Verifikasi Profil Petugas</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>Masukkan Nama Lengkap Anda (Guru BK, Sekbid OSIS, atau Pembina) untuk dicatat pada sistem:</p>
            <form onSubmit={handleSimpanNamaGuru} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Contoh: Dra. Heti Kustini / Budi (OSIS)"
                value={tempNamaGuru}
                onChange={(e) => setTempNamaGuru(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Simpan & Lanjutkan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT BIMBINGAN KELOMPOK */}
      {showModalAddKelompok && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '16px' }}>👥 Tambah Bimbingan Kelompok</h3>
            <form onSubmit={handleSimpanKelompok} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Kelas:</label>
                <select value={formKelompok.kelas} onChange={(e) => setFormKelompok({ ...formKelompok, kelas: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}>
                  {DAFTAR_KELAS_BK.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Topik Bahasan:</label>
                <input required type="text" placeholder="Contoh: Manajeman Waktu Belajar" value={formKelompok.topik} onChange={(e) => setFormKelompok({ ...formKelompok, topik: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Anggota Kelompok:</label>
                <input required type="text" placeholder="Contoh: Ahmad, Rina, Doni" value={formKelompok.anggota} onChange={(e) => setFormKelompok({ ...formKelompok, anggota: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tanggal Sesi:</label>
                <input type="date" value={formKelompok.tanggal} onChange={(e) => setFormKelompok({ ...formKelompok, tanggal: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalAddKelompok(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT BIMBINGAN KLASIKAL */}
      {showModalAddKlasikal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '16px' }}>🏫 Tambah Bimbingan Klasikal</h3>
            <form onSubmit={handleSimpanKlasikal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Kelas Target:</label>
                <select value={formKlasikal.kelas} onChange={(e) => setFormKlasikal({ ...formKlasikal, kelas: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}>
                  {DAFTAR_KELAS_BK.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Materi Pembelajaran BK:</label>
                <input required type="text" placeholder="Contoh: Bahaya Bullying & Etika Bermedsos" value={formKlasikal.materi} onChange={(e) => setFormKlasikal({ ...formKlasikal, materi: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Catatan / Evaluasi:</label>
                <input type="text" placeholder="Contoh: Siswa antusias dan tertib" value={formKlasikal.keterangan} onChange={(e) => setFormKlasikal({ ...formKlasikal, keterangan: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tanggal Pelaksanaan:</label>
                <input type="date" value={formKlasikal.tanggal} onChange={(e) => setFormKlasikal({ ...formKlasikal, tanggal: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalAddKlasikal(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PELANGGARAN KHUSUS GERBANG */}
      {showModalAddPelanggaran && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '18px', maxWidth: '520px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            {/* HEADER MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#991b1b', fontSize: '17px' }}>👮 Input Pelanggaran Gerbang (Aturan Resmi SMKBBC)</h3>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Daftar Pelanggaran Resmi No: 499/188.3-SMK.BBC/VII/2024</span>
              </div>
              <button onClick={() => setShowModalAddPelanggaran(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✖</button>
            </div>

            <form onSubmit={handleSimpanPelanggaran} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* PETUGAS ROLE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Role Petugas Input:</label>
                  <select
                    value={formPelanggaran.role_petugas}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, role_petugas: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    <option value="OSIS & MPK">OSIS & MPK (Piket Gerbang)</option>
                    <option value="Guru BK">Guru BK / Konselor</option>
                    <option value="Wakasek Kesiswaan">Wakasek Kesiswaan / Tim Kedisiplinan</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nama Petugas Piket:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi (Sekbid OSIS)"
                    value={formPelanggaran.nama_petugas}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, nama_petugas: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* DATA SISWA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Kelas Siswa:</label>
                  <select
                    value={formPelanggaran.kelas}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, kelas: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  >
                    {DAFTAR_KELAS_BK.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nama Siswa Melanggar:</label>
                  <input
                    required
                    type="text"
                    placeholder="Ketik Nama Lengkap Siswa"
                    value={formPelanggaran.nama}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, nama: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* SECTION PILIHAN PELANGGARAN + FITUR PENCARIAN / FILTER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Pilih Jenis Pelanggaran Resmi Sekolah:</label>
                  {searchPelanggaran && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                      Filter: "{searchPelanggaran}"
                    </span>
                  )}
                </div>

                {/* SEARCH INPUT BAR */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Cari kata kunci (cth: topi, sepatu, HP, merokok, baju)..."
                    value={searchPelanggaran}
                    onChange={(e) => setSearchPelanggaran(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #10b981',
                      fontSize: '12px',
                      outline: 'none',
                      backgroundColor: '#f0fdf4',
                      boxSizing: 'border-box',
                    }}
                  />
                  {searchPelanggaran && (
                    <button
                      type="button"
                      onClick={() => setSearchPelanggaran('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✖
                    </button>
                  )}
                </div>

                {/* DAFTAR PILIHAN TER-FILTER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  {PRESET_PELANGGARAN_GERBANG
                    .filter(p => p.label.toLowerCase().includes(searchPelanggaran.toLowerCase()))
                    .map((p, idx) => {
                      const isSelected = formPelanggaran.jenis_pelanggaran === p.label;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormPelanggaran({ ...formPelanggaran, jenis_pelanggaran: p.label, poin: p.poin })}
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            border: isSelected ? '1px solid #dc2626' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#fef2f2' : '#ffffff',
                            color: isSelected ? '#991b1b' : '#334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: isSelected ? '0 1px 2px rgba(220, 38, 38, 0.15)' : 'none',
                          }}
                        >
                          <span>{p.label}</span>
                          <span style={{ color: '#dc2626', marginLeft: '8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>+{p.poin} Poin</span>
                        </button>
                      );
                    })}

                  {PRESET_PELANGGARAN_GERBANG.filter(p => p.label.toLowerCase().includes(searchPelanggaran.toLowerCase())).length === 0 && (
                    <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', padding: '12px 8px' }}>
                      🔍 Pelanggaran dengan kata kunci "<strong>{searchPelanggaran}</strong>" tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>

              {/* DETAIL & POIN */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Detail Catatan Pelanggaran:</label>
                  <input
                    required
                    type="text"
                    value={formPelanggaran.jenis_pelanggaran}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, jenis_pelanggaran: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Penambahan Poin:</label>
                  <input
                    required
                    type="number"
                    value={formPelanggaran.poin}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, poin: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box', fontWeight: 'bold', color: '#dc2626' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tanggal Kejadian:</label>
                <input
                  type="date"
                  value={formPelanggaran.tanggal}
                  onChange={(e) => setFormPelanggaran({ ...formPelanggaran, tanggal: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModalAddPelanggaran(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  🚨 Simpan & Akumulasikan Poin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 MODAL PREVIEW FOTO SURAT BUKTI */}
      {selectedFotoPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px', fontWeight: 'bold' }}>📄 Bukti Lampiran Surat Izin / Dokter</h3>
              <button
                onClick={() => setSelectedFotoPreview(null)}
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', width: '100%', textAlign: 'center', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '10px' }}>
              <img
                src={selectedFotoPreview}
                alt="Lampiran Foto Surat"
                style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>

            <button
              onClick={() => setSelectedFotoPreview(null)}
              style={{ marginTop: '16px', backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}