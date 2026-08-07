'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type RoleType = 'BK' | 'PIKET' | 'OSIS-MPK';

interface AdminProfile {
  nama: string;
  email: string;
  initial: string;
  color: string;
  badgeColor: string;
}

const DEFAULT_PROFILES: Record<RoleType, AdminProfile> = {
  BK: { nama: 'Bu Hj Eli, S.Pd', email: 'bk@smkbudibakti.sch.id', initial: 'BK', color: '#bfdbfe', badgeColor: '#3b82f6' },
  PIKET: { nama: 'Pak Cecep, S.Pd', email: 'piket@smkbudibakti.sch.id', initial: 'PK', color: '#fef08a', badgeColor: '#eab308' },
  'OSIS-MPK': { nama: 'Pengurus OSIS & MPK', email: 'osis-mpk@smkbudibakti.sch.id', initial: 'OM', color: '#fbcfe8', badgeColor: '#ec4899' },
};

// LIST OPSIONAL PELANGGARAN GERBANG
const LIST_PELANGGARAN = [
  { text: '👖 Baju / Seragam Tidak Dimasukkan', poin: 5 },
  { text: '🏷️ Tidak Memakai Badge / Kaos Kaki Putih', poin: 5 },
  { text: '👟 Sepatu / Kaos Dalam Tidak Sesuai Ketentuan', poin: 10 },
  { text: '🧢 Memakai Topi Bebas di Lingkungan Sekolah', poin: 10 },
  { text: '📱 Membawa / Menggunakan HP Tanpa Izin', poin: 15 },
  { text: '🚬 Merokok / Vaping di Lingkungan Sekolah', poin: 25 },
];

export default function AdminDashboardPage() {
  const [role, setRole] = useState<RoleType>('BK');
  const [profilRole, setProfilRole] = useState<Record<RoleType, AdminProfile>>(DEFAULT_PROFILES);

  // STATE BK
  const [tabBK, setTabBK] = useState<'curhat' | 'izin_sakit' | 'konseling_ind' | 'home_visit' | 'panggilan_ortu'>('curhat');
  const [isLoading, setIsLoading] = useState(false);

  // DATA STATE DINAMIS
  const [dataCurhat, setDataCurhat] = useState<any[]>([]);
  const [dataIzinSakit, setDataIzinSakit] = useState<any[]>([]);
  const [dataKonselingInd, setDataKonselingInd] = useState<any[]>([]);
  const [dataHomeVisit, setDataHomeVisit] = useState<any[]>([]);
  const [dataPanggilanOrtu, setDataPanggilanOrtu] = useState<any[]>([]);
  const [dataTerlambat, setDataTerlambat] = useState<any[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<any[]>([]);

  // MODAL STATES
  const [modalCurhatDetail, setModalCurhatDetail] = useState<any>(null);
  const [textBalasan, setTextBalasan] = useState('');
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [showModalAddKonseling, setShowModalAddKonseling] = useState(false);
  const [formKonseling, setFormKonseling] = useState({ nama: '', tanggal: '', topik: '' });
  const [showModalAddHomeVisit, setShowModalAddHomeVisit] = useState(false);
  const [formHomeVisit, setFormHomeVisit] = useState({ nama: '', alamat: '', tanggal: '', alasan: '' });
  const [showModalAddOrtu, setShowModalAddOrtu] = useState(false);
  const [formOrtu, setFormOrtu] = useState({ nama: '', ortu: '', tanggal: '', alasan: '' });
  const [previewSurat, setPreviewSurat] = useState<{ judul: string; detail: string } | null>(null);

  // STATE FORM & MODAL PELANGGARAN GERBANG
  const [showModalAddPelanggaran, setShowModalAddPelanggaran] = useState(false);
  const [searchPelanggaran, setSearchPelanggaran] = useState('');
  const [formPelanggaran, setFormPelanggaran] = useState({
    pelapor: '',
    nama_siswa: '',
    kelas: 'X BRP 1',
    jenis_pelanggaran: '',
    poin: '5',
    keterangan: ''
  });

  // KAMERA STATE & REF
  const [previewFotoPelanggaran, setPreviewFotoPelanggaran] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // =========================================================================
  // 🔄 FETCH DATA DINAMIS DARI SUPABASE
  // =========================================================================
  const fetchAllData = async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Admin Profile
      const { data: dbRoles } = await supabase.from('admin_roles').select('*');
      if (dbRoles && dbRoles.length > 0) {
        const updated = { ...DEFAULT_PROFILES };
        dbRoles.forEach((r: any) => {
          const key = (r.role || '').toUpperCase() as RoleType;
          if (updated[key]) {
            updated[key].nama = r.nama || updated[key].nama;
            updated[key].email = r.email || updated[key].email;
          }
        });
        setProfilRole(updated);
      }

      // 2. Fetch Layanan Siswa
      const { data: sbData } = await supabase.from('layanan_siswa').select('*').order('created_at', { ascending: false });
      const layananList = sbData || [];

      // Curhat
      const curhatList = layananList
        .filter((d: any) => {
          const lay = (d.layanan || '').toUpperCase();
          return lay === 'CURHAT' || (!lay && Boolean(d.pesan));
        })
        .map((item: any) => ({
          id: item.id,
          judul: item.judul_pesan || item.judul || 'Curhat Siswa',
          isi: item.pesan || item.keterangan || '-',
          tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : item.tanggal || '-',
          jenis: item.tujuan_konselor || 'Peer Konseling',
          status: item.status || 'TERKIRIM',
          balasan: item.balasan || '',
          nama_siswa: item.nama_siswa || item.nama || 'Anonim',
          kelas: item.kelas || '-'
        }));
      setDataCurhat(curhatList);

      // Izin/Sakit
      const izinList = layananList
        .filter((d: any) => (d.layanan || '').toUpperCase() === 'IZIN')
        .map((item: any) => ({
          id: item.id,
          nama: item.nama_siswa || item.nama || 'Siswa',
          kelas: item.kelas || '-',
          jenis: item.jenis_izin || item.jenis || 'Izin/Sakit',
          tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : item.tanggal || '-',
          keterangan: item.pesan || item.keterangan || item.alasan || '-',
          foto: item.foto_bukti || null,
          status: item.status || 'Menunggu Tanggapan'
        }));
      setDataIzinSakit(izinList);

      // Konseling
      const konselingList = layananList
        .filter((d: any) => {
          const lay = (d.layanan || '').toUpperCase();
          return lay === 'KONSELING' || lay === 'KELOMPOK';
        })
        .map((item: any) => ({
          id: item.id,
          nama: item.nama_siswa ? `${item.nama_siswa} (${item.kelas || '-'})` : (item.nama || '-'),
          tanggal: item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'),
          topik: item.topik || `${item.judul_pesan || 'Konseling'} - ${item.pesan || ''}`,
          status: item.status || 'TERJADWAL'
        }));
      setDataKonselingInd(konselingList);

      // Home Visit
      const homeVisitList = layananList
        .filter((d: any) => (d.layanan || '').toUpperCase() === 'HOME_VISIT')
        .map((item: any) => ({
          id: item.id,
          nama: item.nama_siswa || item.nama || '-',
          alamat: item.alamat || '-',
          tanggal: item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'),
          alasan: item.alasan || item.pesan || '-',
          status: item.status || 'Rencana Visit'
        }));
      setDataHomeVisit(homeVisitList);

      // Panggilan Ortu
      const ortuList = layananList
        .filter((d: any) => (d.layanan || '').toUpperCase() === 'PANGGILAN_ORTU')
        .map((item: any) => ({
          id: item.id,
          nama: item.nama_siswa || item.nama || '-',
          ortu: item.ortu || item.nama_ortu || '-',
          tanggal: item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'),
          alasan: item.alasan || item.pesan || '-',
          status: item.status || 'Surat Terkirim'
        }));
      setDataPanggilanOrtu(ortuList);

      // 3. Keterlambatan
      const { data: sbTerlambat } = await supabase.from('keterlambatan').select('*').order('created_at', { ascending: false });
      setDataTerlambat(sbTerlambat || []);

      // 4. Laporan Pelanggaran Gerbang
      const { data: sbPelanggaran } = await supabase.from('laporan_pelanggaran').select('*').order('created_at', { ascending: false });
      setDataPelanggaran(sbPelanggaran || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // =========================================================================
  // 📸 KAMERA LOGIC
  // =========================================================================
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Kamera webcam browser tidak diizinkan. Silakan gunakan tombol "📸 Kamera HP" di sebelahnya!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewFotoPelanggaran(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFotoPelanggaran(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // =========================================================================
  // 💾 HANDLERS ACTION DINAMIS
  // =========================================================================
  const handleSimpanPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPelanggaran.nama_siswa || !formPelanggaran.jenis_pelanggaran) {
      alert('Mohon isi nama siswa dan pilih jenis pelanggaran!');
      return;
    }

    try {
      const pelaporName = formPelanggaran.pelapor || `Petugas (${role})`;
      const { error } = await supabase.from('laporan_pelanggaran').insert([{
        nama_siswa: formPelanggaran.nama_siswa,
        kelas: formPelanggaran.kelas,
        jenis_pelanggaran: formPelanggaran.jenis_pelanggaran,
        poin: parseInt(formPelanggaran.poin) || 5,
        keterangan: formPelanggaran.keterangan || '-',
        foto_url: previewFotoPelanggaran,
        pelapor: pelaporName,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      alert('✅ Catatan pelanggaran gerbang berhasil disimpan!');
      fetchAllData();
      setShowModalAddPelanggaran(false);
      setFormPelanggaran({ pelapor: '', nama_siswa: '', kelas: 'X BRP 1', jenis_pelanggaran: '', poin: '5', keterangan: '' });
      setPreviewFotoPelanggaran(null);
      stopCamera();
    } catch (err: any) {
      alert('❌ Gagal menyimpan: ' + err.message);
    }
  };

  const handleBalasCurhat = async () => {
    if (!textBalasan.trim() || !modalCurhatDetail) return;
    try {
      const { error } = await supabase.from('layanan_siswa').update({ status: 'Selesai', balasan: textBalasan }).eq('id', modalCurhatDetail.id);
      if (!error) fetchAllData();
    } catch (e) {
      console.error(e);
    }
    setModalCurhatDetail(null);
    setTextBalasan('');
  };

  const handleUpdateStatusIzin = async (id: any, status: string) => {
    try {
      const { error } = await supabase.from('layanan_siswa').update({ status }).eq('id', id);
      if (!error) fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimpanKonseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKonseling.nama) return;
    try {
      const { error } = await supabase.from('layanan_siswa').insert({
        layanan: 'KONSELING',
        nama_siswa: formKonseling.nama,
        tanggal: formKonseling.tanggal,
        topik: formKonseling.topik,
        judul_pesan: formKonseling.topik,
        status: 'TERJADWAL'
      });
      if (!error) fetchAllData();
    } catch (err) {
      console.error(err);
    }
    setShowModalAddKonseling(false);
    setFormKonseling({ nama: '', tanggal: '', topik: '' });
  };

  const handleSimpanHomeVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHomeVisit.nama) return;
    try {
      const { error } = await supabase.from('layanan_siswa').insert({
        layanan: 'HOME_VISIT',
        nama_siswa: formHomeVisit.nama,
        alamat: formHomeVisit.alamat,
        tanggal: formHomeVisit.tanggal,
        alasan: formHomeVisit.alasan,
        status: 'Rencana Visit'
      });
      if (!error) fetchAllData();
    } catch (err) {
      console.error(err);
    }
    setShowModalAddHomeVisit(false);
    setFormHomeVisit({ nama: '', alamat: '', tanggal: '', alasan: '' });
  };

  const handleSimpanPanggilanOrtu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrtu.nama) return;
    try {
      const { error } = await supabase.from('layanan_siswa').insert({
        layanan: 'PANGGILAN_ORTU',
        nama_siswa: formOrtu.nama,
        ortu: formOrtu.ortu,
        tanggal: formOrtu.tanggal,
        alasan: formOrtu.alasan,
        status: 'Surat Terkirim'
      });
      if (!error) fetchAllData();
    } catch (err) {
      console.error(err);
    }
    setShowModalAddOrtu(false);
    setFormOrtu({ nama: '', ortu: '', tanggal: '', alasan: '' });
  };

  const profileAktif = profilRole[role];
  const filteredPelanggaranList = LIST_PELANGGARAN.filter(p => p.text.toLowerCase().includes(searchPelanggaran.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937', margin: 0, padding: 0 }}>

      {/* 🧭 NAVBAR RESPONSIVE */}
      <nav style={{
        backgroundColor: '#1b3b2b',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>MindGuard - SMK Budi Bakti</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Sistem Integrated BK, Piket, OSIS & MPK</div>
          </div>
        </div>

        {/* SWITCHER ROLE & REFRESH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchAllData}
            style={{ padding: '7px 12px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#059669', color: '#ffffff' }}
          >
            {isLoading ? '⌛ Memuat...' : '🔄 Refresh Data'}
          </button>

          <div style={{ display: 'flex', backgroundColor: '#0f291e', padding: '3px', borderRadius: '20px', border: '1px solid #2d523e' }}>
            {(['BK', 'PIKET', 'OSIS-MPK'] as RoleType[]).map((rKey) => (
              <button
                key={rKey}
                onClick={() => setRole(rKey)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: role === rKey ? profilRole[rKey].badgeColor : 'transparent',
                  color: role === rKey ? '#ffffff' : '#a7f3d0'
                }}
              >
                {rKey}
              </button>
            ))}
          </div>
        </div>

        {/* PROFIL INFO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: profileAktif.color, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', border: '2px solid #ffffff' }}>
            {profileAktif.initial}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>👋 {profileAktif.nama}</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', fontStyle: 'italic' }}>✉️ {profileAktif.email}</div>
          </div>
        </div>
      </nav>

      {/* 📌 MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 12px' }}>

        {/* ========================================================================= */}
        {/* PANEL GURU BK                                                            */}
        {/* ========================================================================= */}
        {role === 'BK' && (
          <div>
            {/* STATISTIK BK - MOBILE GRID ADAPTATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 'bold' }}>💬 CURHAT SISWA</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '2px' }}>{dataCurhat.length} Pesan</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '10px', color: '#9333ea', fontWeight: 'bold' }}>📝 IZIN & SAKIT</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7e22ce', marginTop: '2px' }}>{dataIzinSakit.length} Izin</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>👤 KONSELING</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#047857', marginTop: '2px' }}>{dataKonselingInd.length} Sesi</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 'bold' }}>🏠 HOME VISIT</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#b45309', marginTop: '2px' }}>{dataHomeVisit.length} Agenda</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold' }}>📞 PANGGILAN ORTU</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#be123c', marginTop: '2px' }}>{dataPanggilanOrtu.length} Surat</div>
              </div>
            </div>

            {/* TAB MENU BK */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
              {[
                { id: 'curhat', label: '💭 Curhat Siswa' },
                { id: 'izin_sakit', label: '📝 Izin & Sakit' },
                { id: 'konseling_ind', label: '👤 Konseling Indv.' },
                { id: 'home_visit', label: '🏠 Home Visit' },
                { id: 'panggilan_ortu', label: '📞 Panggilan Ortu' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabBK(tab.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    backgroundColor: tabBK === tab.id ? '#1b3b2b' : '#ffffff',
                    color: tabBK === tab.id ? '#ffffff' : '#1b3b2b',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* KONTEN TAB BK */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>

              {/* TAB CURHAT */}
              {tabBK === 'curhat' && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>💭 Pesan Curhat dari Siswa</h3>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                          <th style={{ padding: '10px' }}>Pengirim / Kelas</th>
                          <th style={{ padding: '10px' }}>Judul Pesan</th>
                          <th style={{ padding: '10px' }}>Tanggal</th>
                          <th style={{ padding: '10px' }}>Tujuan Konselor</th>
                          <th style={{ padding: '10px' }}>Status Response</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Aksi BK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataCurhat.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada pesan curhat yang masuk.</td></tr>
                        ) : (
                          dataCurhat.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                              <td style={{ padding: '10px' }}>
                                {item.nama_siswa === 'Anonim' || item.nama_siswa === 'Siswa Rahasia (Anonim)' ? (
                                  <span style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>🔒 Anonim</span>
                                ) : (
                                  <div>
                                    <div style={{ fontWeight: 'bold', color: '#1b3b2b' }}>{item.nama_siswa}</div>
                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{item.kelas}</div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.judul}</td>
                              <td style={{ padding: '10px' }}>{item.tanggal}</td>
                              <td style={{ padding: '10px' }}>{item.jenis}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ backgroundColor: item.status === 'Selesai' ? '#d1fae5' : '#fef3c7', color: item.status === 'Selesai' ? '#065f46' : '#92400e', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => { setModalCurhatDetail(item); setTextBalasan(item.balasan); }}
                                  style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  📂 Buka & Balas
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB IZIN SAKIT */}
              {tabBK === 'izin_sakit' && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>📝 Surat Izin / Sakit Siswa</h3>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                          <th style={{ padding: '10px' }}>Kelas</th>
                          <th style={{ padding: '10px' }}>Nama Siswa</th>
                          <th style={{ padding: '10px' }}>Jenis Izin</th>
                          <th style={{ padding: '10px' }}>Tanggal</th>
                          <th style={{ padding: '10px' }}>Keterangan</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Foto</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Aksi Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataIzinSakit.length === 0 ? (
                          <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada pengajuan izin atau sakit.</td></tr>
                        ) : (
                          dataIzinSakit.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.kelas}</td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ backgroundColor: item.jenis === 'Sakit' ? '#fee2e2' : '#dbeafe', color: item.jenis === 'Sakit' ? '#991b1b' : '#1e40af', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>
                                  {item.jenis}
                                </span>
                              </td>
                              <td style={{ padding: '10px' }}>{item.tanggal}</td>
                              <td style={{ padding: '10px' }}>{item.keterangan}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.foto ? (
                                  <button
                                    onClick={() => setPreviewFoto(item.foto)}
                                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                  >
                                    🖼️ Lihat
                                  </button>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>Tanpa Foto</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button onClick={() => handleUpdateStatusIzin(item.id, 'Disetujui')} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>✓ Setuju</button>
                                  <button onClick={() => handleUpdateStatusIzin(item.id, 'Ditolak')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>✕ Tolak</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB KONSELING INDIVIDUAL */}
              {tabBK === 'konseling_ind' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>👤 Agenda Konseling Individual</h3>
                    <button onClick={() => setShowModalAddKonseling(true)} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>+ Agendakan Konseling</button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                          <th style={{ padding: '10px' }}>Nama Siswa / Kelompok</th>
                          <th style={{ padding: '10px' }}>Tanggal / Jadwal</th>
                          <th style={{ padding: '10px' }}>Topik / Catatan</th>
                          <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataKonselingInd.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada agenda konseling.</td></tr>
                        ) : (
                          dataKonselingInd.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama}</td>
                              <td style={{ padding: '10px' }}>{item.tanggal}</td>
                              <td style={{ padding: '10px' }}>{item.topik}</td>
                              <td style={{ padding: '10px' }}><span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>{item.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB HOME VISIT */}
              {tabBK === 'home_visit' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>🏠 Agenda Home Visit</h3>
                    <button onClick={() => setShowModalAddHomeVisit(true)} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>+ Buat Home Visit</button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                          <th style={{ padding: '10px' }}>Nama Siswa</th>
                          <th style={{ padding: '10px' }}>Alamat</th>
                          <th style={{ padding: '10px' }}>Tanggal</th>
                          <th style={{ padding: '10px' }}>Alasan</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataHomeVisit.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada agenda home visit.</td></tr>
                        ) : (
                          dataHomeVisit.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama}</td>
                              <td style={{ padding: '10px' }}>{item.alamat}</td>
                              <td style={{ padding: '10px' }}>{item.tanggal}</td>
                              <td style={{ padding: '10px' }}>{item.alasan}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button onClick={() => setPreviewSurat({ judul: `SURAT TUGAS HOME VISIT - ${item.nama}`, detail: `Petugas BK ditugaskan mengunjungi tempat tinggal ${item.nama} di ${item.alamat} pada tanggal ${item.tanggal} dikarenakan: ${item.alasan}.` })} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Surat</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB PANGGILAN ORTU */}
              {tabBK === 'panggilan_ortu' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '16px' }}>📞 Pemanggilan Orang Tua</h3>
                    <button onClick={() => setShowModalAddOrtu(true)} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>+ Buat Surat Panggilan</button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                          <th style={{ padding: '10px' }}>Nama Siswa</th>
                          <th style={{ padding: '10px' }}>Orang Tua</th>
                          <th style={{ padding: '10px' }}>Tanggal</th>
                          <th style={{ padding: '10px' }}>Alasan</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataPanggilanOrtu.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada panggilan orang tua.</td></tr>
                        ) : (
                          dataPanggilanOrtu.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama}</td>
                              <td style={{ padding: '10px' }}>{item.ortu}</td>
                              <td style={{ padding: '10px' }}>{item.tanggal}</td>
                              <td style={{ padding: '10px' }}>{item.alasan}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button onClick={() => setPreviewSurat({ judul: `SURAT PEMANGGILAN ORANG TUA - ${item.nama}`, detail: `Kepada Yth. ${item.ortu}, Mengharap kehadiran Bapak/Ibu pada tanggal ${item.tanggal} di ruang BK SMK Budi Bakti Ciwidey terkait: ${item.alasan}.` })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Surat</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL GURU PIKET                                                         */}
        {/* ========================================================================= */}
        {role === 'PIKET' && (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>⏰ Catatan Keterlambatan Siswa (Guru Piket: {profileAktif.nama})</h3>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '10px' }}>Nama Siswa</th>
                    <th style={{ padding: '10px' }}>Kelas</th>
                    <th style={{ padding: '10px' }}>Jam Datang</th>
                    <th style={{ padding: '10px' }}>Alasan Terlambat</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Cetak Izin Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTerlambat.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada data keterlambatan siswa.</td></tr>
                  ) : (
                    dataTerlambat.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama_siswa || item.nama}</td>
                        <td style={{ padding: '10px' }}>{item.kelas}</td>
                        <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>{item.jam_datang || item.jam}</td>
                        <td style={{ padding: '10px' }}>{item.alasan}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            onClick={() => setPreviewSurat({ judul: `SURAT IZIN MASUK KELAS - ${item.nama_siswa || item.nama}`, detail: `Siswa bernama ${item.nama_siswa || item.nama} (${item.kelas}) telah melapor ke Piket pada jam ${item.jam_datang || item.jam} dengan alasan: ${item.alasan}. Diberikan izin masuk kelas.` })}
                            style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            🖨️ Cetak Surat Masuk
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL OSIS & MPK GABUNGAN                                                */}
        {/* ========================================================================= */}
        {role === 'OSIS-MPK' && (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #fbcfe8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#831843', fontSize: '16px' }}>🪷 Panel Peer Counselor & Kedisiplinan OSIS & MPK</h3>
                <p style={{ fontSize: '11px', color: '#9d174d', margin: '2px 0 0 0' }}>Petugas: {profileAktif.nama}</p>
              </div>
              <button
                onClick={() => setShowModalAddPelanggaran(true)}
                style={{ backgroundColor: '#be185d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
              >
                📸 + Catat Pelanggaran Gerbang
              </button>
            </div>

            {/* TABEL 1: CURHATAN SISWA */}
            <h4 style={{ color: '#be185d', marginBottom: '6px', fontSize: '13px' }}>💬 Curhatan Masuk ke Peer Counselor</h4>
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '20px' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#be185d', color: '#fff' }}>
                    <th style={{ padding: '10px' }}>Judul Curhatan</th>
                    <th style={{ padding: '10px' }}>Tanggal</th>
                    <th style={{ padding: '10px' }}>Tujuan</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Aksi Peer Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {dataCurhat.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada curhatan dari siswa.</td></tr>
                  ) : (
                    dataCurhat.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #fbcfe8' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.judul}</td>
                        <td style={{ padding: '10px' }}>{item.tanggal}</td>
                        <td style={{ padding: '10px' }}>{item.jenis}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: item.status === 'Selesai' ? '#d1fae5' : '#fce7f3', color: item.status === 'Selesai' ? '#065f46' : '#be185d', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>{item.status}</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            onClick={() => { setModalCurhatDetail(item); setTextBalasan(item.balasan); }}
                            style={{ backgroundColor: '#be185d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            📂 Buka & Balas
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 2: PENGAWASAN IZIN & SAKIT SISWA */}
            <h4 style={{ color: '#6d28d9', marginBottom: '6px', fontSize: '13px' }}>📝 Pengawasan Izin & Sakit Siswa</h4>
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '20px' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#6d28d9', color: '#fff' }}>
                    <th style={{ padding: '10px' }}>Kelas</th>
                    <th style={{ padding: '10px' }}>Nama Siswa</th>
                    <th style={{ padding: '10px' }}>Jenis Izin</th>
                    <th style={{ padding: '10px' }}>Tanggal</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataIzinSakit.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada pengawasan izin siswa.</td></tr>
                  ) : (
                    dataIzinSakit.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #ddd6fe' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.kelas}</td>
                        <td style={{ padding: '10px' }}>{item.nama}</td>
                        <td style={{ padding: '10px' }}>{item.jenis}</td>
                        <td style={{ padding: '10px' }}>{item.tanggal}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>{item.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 3: RIWAYAT PELANGGARAN YANG DICATAT OSIS & MPK */}
            <h4 style={{ color: '#be185d', marginBottom: '6px', fontSize: '13px' }}>🚨 Rekap Laporan Pelanggaran Kedisiplinan Siswa Hasil Patroli</h4>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#831843', color: '#fff' }}>
                    <th style={{ padding: '10px' }}>Nama Siswa / Kelas</th>
                    <th style={{ padding: '10px' }}>Jenis Pelanggaran</th>
                    <th style={{ padding: '10px' }}>Poin</th>
                    <th style={{ padding: '10px' }}>Pelapor</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Foto Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPelanggaran.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada pelanggaran yang dicatat.</td></tr>
                  ) : (
                    dataPelanggaran.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #fbcfe8' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama_siswa} ({item.kelas})</td>
                        <td style={{ padding: '10px' }}>{item.jenis_pelanggaran}</td>
                        <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>+{item.poin} Poin</td>
                        <td style={{ padding: '10px' }}>{item.pelapor}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {item.foto_url ? (
                            <button onClick={() => setPreviewFoto(item.foto_url)} style={{ backgroundColor: '#be185d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🖼️ Lihat Foto</button>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '10px', fontStyle: 'italic' }}>Tanpa Foto</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 🔮 MODALS RESPONSIVE                                                     */}
      {/* ========================================================================= */}

      {/* 1. MODAL CATAT PELANGGARAN GERBANG */}
      {showModalAddPelanggaran && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', maxWidth: '500px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>➕</span> Catat Pelanggaran Gerbang
              </h3>
              <button
                type="button"
                onClick={() => { setShowModalAddPelanggaran(false); stopCamera(); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanPelanggaran} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  Petugas Pelapor / Pencatat:
                </label>
                <select
                  value={formPelanggaran.pelapor || `Petugas (${role})`}
                  onChange={(e) => setFormPelanggaran({ ...formPelanggaran, pelapor: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: '#fff', outline: 'none' }}
                >
                  <option value={`Petugas (${role})`}>Petugas ({role})</option>
                  <option value={`Tim ${role} Kedisiplinan`}>Tim {role} Kedisiplinan</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                    Kelas:
                  </label>
                  <select
                    value={formPelanggaran.kelas}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, kelas: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: '#fff', outline: 'none' }}
                  >
                    <option value="X BRP 1">X BRP 1</option>
                    <option value="X BRP 2">X BRP 2</option>
                    <option value="XI AKL 1">XI AKL 1</option>
                    <option value="XII MPLB 1">XII MPLB 1</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                    Nama Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Siswa"
                    value={formPelanggaran.nama_siswa}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, nama_siswa: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  Pilih Pelanggaran:
                </label>
                <input
                  type="text"
                  placeholder="🔍 Cari jenis pelanggaran..."
                  value={searchPelanggaran}
                  onChange={(e) => setSearchPelanggaran(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #10b981', fontSize: '12px', boxSizing: 'border-box', outline: 'none', marginBottom: '6px' }}
                />

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                  {filteredPelanggaranList.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormPelanggaran({ ...formPelanggaran, jenis_pelanggaran: p.text, poin: p.poin.toString() })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: formPelanggaran.jenis_pelanggaran === p.text ? '#fef2f2' : '#ffffff',
                        border: `1px solid ${formPelanggaran.jenis_pelanggaran === p.text ? '#ef4444' : '#f3f4f6'}`,
                        color: formPelanggaran.jenis_pelanggaran === p.text ? '#991b1b' : '#374151'
                      }}
                    >
                      <span>{p.text}</span>
                      <span style={{ color: '#dc2626' }}>+{p.poin} Pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                  Catatan Detail:
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Datang jam 07:20..."
                  value={formPelanggaran.keterangan}
                  onChange={(e) => setFormPelanggaran({ ...formPelanggaran, keterangan: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
                />
              </div>

              {/* BUKTI FOTO & KAMERA INTEGRATION */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1.5px dashed #059669' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#065f46', marginBottom: '8px' }}>
                  📷 Bukti Foto Pelanggaran:
                </label>

                {!isCameraActive && !previewFotoPelanggaran && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label style={{ flex: 1, padding: '8px 6px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>
                        📸 Kamera HP
                        <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        style={{ flex: 1, padding: '8px 6px', backgroundColor: '#1b3b2b', color: '#ffffff', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                      >
                        💻 Webcam Live
                      </button>
                    </div>
                    <label style={{ padding: '6px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer', textAlign: 'center' }}>
                      📁 Upload Galeri
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {isCameraActive && (
                  <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    <div style={{ padding: '6px', display: 'flex', justifyContent: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <button type="button" onClick={takePhoto} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>⚪ Jepret</button>
                      <button type="button" onClick={stopCamera} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>✕ Batal</button>
                    </div>
                  </div>
                )}

                {previewFotoPelanggaran && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={previewFotoPelanggaran} alt="Preview Bukti" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', border: '2px solid #059669', backgroundColor: '#000' }} />
                    <button type="button" onClick={() => setPreviewFotoPelanggaran(null)} style={{ marginTop: '6px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Hapus Foto</button>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => { setShowModalAddPelanggaran(false); stopCamera(); }} style={{ padding: '8px 14px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>🚨 Simpan Catatan</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL BALAS CURHAT */}
      {modalCurhatDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', maxWidth: '450px', width: '95%' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b', fontSize: '16px' }}>💬 Detail Curhat Siswa</h3>

            <div style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
              <strong>Pengirim:</strong> {modalCurhatDetail.nama_siswa} ({modalCurhatDetail.kelas})<br />
              <strong>Judul:</strong> {modalCurhatDetail.judul} <br />
              <strong>Pesan:</strong> "{modalCurhatDetail.isi}"
            </div>

            <textarea value={textBalasan} onChange={(e) => setTextBalasan(e.target.value)} rows={4} placeholder="Ketik jawaban konseling di sini..." style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setModalCurhatDetail(null)} style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleBalasCurhat} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Kirim Balasan</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL PREVIEW FOTO */}
      {previewFoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', maxWidth: '450px', width: '95%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b', fontSize: '15px' }}>📷 Lampiran Foto Bukti</h3>
            <img src={previewFoto} alt="Bukti Foto" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
            <button onClick={() => setPreviewFoto(null)} style={{ marginTop: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Tutup</button>
          </div>
        </div>
      )}

      {/* 4. MODAL KONSELING */}
      {showModalAddKonseling && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', maxWidth: '400px', width: '95%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>👤 Agendakan Konseling</h3>
            <form onSubmit={handleSimpanKonseling}>
              <input required placeholder="Nama Siswa & Kelas" value={formKonseling.nama} onChange={(e) => setFormKonseling({ ...formKonseling, nama: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Tanggal Pelaksanaan" value={formKonseling.tanggal} onChange={(e) => setFormKonseling({ ...formKonseling, tanggal: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Topik Masalah" value={formKonseling.topik} onChange={(e) => setFormKonseling({ ...formKonseling, topik: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddKonseling(false)} style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL HOME VISIT */}
      {showModalAddHomeVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', maxWidth: '400px', width: '95%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>🏠 Buat Home Visit</h3>
            <form onSubmit={handleSimpanHomeVisit}>
              <input required placeholder="Nama Siswa & Kelas" value={formHomeVisit.nama} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, nama: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Alamat Rumah" value={formHomeVisit.alamat} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alamat: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Tanggal Visit" value={formHomeVisit.tanggal} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, tanggal: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Alasan Visit" value={formHomeVisit.alasan} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alasan: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddHomeVisit(false)} style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL PANGGILAN ORTU */}
      {showModalAddOrtu && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', maxWidth: '400px', width: '95%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px' }}>📞 Buat Panggilan Orang Tua</h3>
            <form onSubmit={handleSimpanPanggilanOrtu}>
              <input required placeholder="Nama Siswa & Kelas" value={formOrtu.nama} onChange={(e) => setFormOrtu({ ...formOrtu, nama: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Nama Orang Tua / Wali" value={formOrtu.ortu} onChange={(e) => setFormOrtu({ ...formOrtu, ortu: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Tanggal Pertemuan" value={formOrtu.tanggal} onChange={(e) => setFormOrtu({ ...formOrtu, tanggal: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <input required placeholder="Alasan Pemanggilan" value={formOrtu.alasan} onChange={(e) => setFormOrtu({ ...formOrtu, alasan: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddOrtu(false)} style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL PREVIEW SURAT */}
      {previewSurat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '95%', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b', fontSize: '15px' }}>{previewSurat.judul}</h3>
            <p style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px', lineHeight: '1.5', textAlign: 'left' }}>
              {previewSurat.detail}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={() => setPreviewSurat(null)} style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Tutup</button>
              <button onClick={() => { alert('Mencetak surat...'); setPreviewSurat(null); }} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🖨️ Cetak Dokumen</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}