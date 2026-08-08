'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck,
  RotateCw,
  MessageSquareText,
  ClipboardList,
  UserCheck,
  Home,
  PhoneCall,
  Clock,
  AlertTriangle,
  FolderOpen,
  Eye,
  CheckCircle2,
  XCircle,
  Printer,
  Camera,
  Upload,
  Plus,
  X,
  FileText
} from 'lucide-react';

type RoleType = 'BK' | 'PIKET' | 'OSIS-MPK';

interface AdminProfile {
  nama: string;
  email: string;
  initial: string;
  color: string;
  badgeColor: string;
}

const DEFAULT_PROFILES: Record<RoleType, AdminProfile> = {
  BK: { nama: 'Bu Hj Eli, S.Pd', email: 'bk@smkbudibakti.sch.id', initial: 'BK', color: '#bfdbfe', badgeColor: '#059669' },
  PIKET: { nama: 'Pak Cecep, S.Pd', email: 'piket@smkbudibakti.sch.id', initial: 'PK', color: '#fef08a', badgeColor: '#0d9488' },
  'OSIS-MPK': { nama: 'Pengurus OSIS & MPK', email: 'osis-mpk@smkbudibakti.sch.id', initial: 'OM', color: '#fbcfe8', badgeColor: '#be185d' },
};

const LIST_PELANGGARAN = [
  { text: 'Baju / Seragam Tidak Dimasukkan', poin: 5 },
  { text: 'Tidak Memakai Badge / Kaos Kaki Putih', poin: 5 },
  { text: 'Sepatu / Kaos Dalam Tidak Sesuai Ketentuan', poin: 10 },
  { text: 'Memakai Topi Bebas di Lingkungan Sekolah', poin: 10 },
  { text: 'Membawa / Menggunakan HP Tanpa Izin', poin: 15 },
  { text: 'Merokok / Vaping di Lingkungan Sekolah', poin: 25 },
];

export default function AdminDashboardPage() {
  const [role, setRole] = useState<RoleType>('BK');
  const [profilRole, setProfilRole] = useState<Record<RoleType, AdminProfile>>(DEFAULT_PROFILES);

  const [tabBK, setTabBK] = useState<'curhat' | 'izin_sakit' | 'konseling_ind' | 'home_visit' | 'panggilan_ortu'>('curhat');
  const [isLoading, setIsLoading] = useState(false);

  const [dataCurhat, setDataCurhat] = useState<any[]>([]);
  const [dataIzinSakit, setDataIzinSakit] = useState<any[]>([]);
  const [dataKonselingInd, setDataKonselingInd] = useState<any[]>([]);
  const [dataHomeVisit, setDataHomeVisit] = useState<any[]>([]);
  const [dataPanggilanOrtu, setDataPanggilanOrtu] = useState<any[]>([]);
  const [dataTerlambat, setDataTerlambat] = useState<any[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<any[]>([]);

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

  const [previewFotoPelanggaran, setPreviewFotoPelanggaran] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);

    try {
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

      const { data: sbData } = await supabase.from('layanan_siswa').select('*').order('created_at', { ascending: false });
      const layananList = sbData || [];

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

      const { data: sbTerlambat } = await supabase.from('keterlambatan').select('*').order('created_at', { ascending: false });
      setDataTerlambat(sbTerlambat || []);

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
      alert('Kamera webcam browser tidak diizinkan. Silakan gunakan opsi upload file atau kamera HP!');
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

      alert('Catatan pelanggaran gerbang berhasil disimpan!');
      fetchAllData();
      setShowModalAddPelanggaran(false);
      setFormPelanggaran({ pelapor: '', nama_siswa: '', kelas: 'X BRP 1', jenis_pelanggaran: '', poin: '5', keterangan: '' });
      setPreviewFotoPelanggaran(null);
      stopCamera();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
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
    <div style={{ backgroundColor: '#e4f4ea', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', margin: 0, padding: 0 }}>

      {/* 🧭 NAVBAR RESPONSIVE DENGAN GRADASI PREMIUM */}
      <nav style={{
        background: 'linear-gradient(135deg, #1b3b2b 0%, #0d2318 100%)',
        color: '#ffffff',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(45, 82, 62, 0.6)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2d523e 0%, #173d2a 100%)',
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid #3d6e53',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="#86efac" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>MindGuard - SMK Budi Bakti</div>
            <div style={{ fontSize: '11px', color: '#86efac', fontWeight: '500' }}>Sistem Integrated BK, Piket, OSIS & MPK</div>
          </div>
        </div>

        {/* SWITCHER ROLE & REFRESH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #2d523e 0%, #1f4230 100%)',
              border: '1px solid #4a8063',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} color="#86efac" />
            <span>{isLoading ? 'Memuat...' : 'Refresh Data'}</span>
          </button>

          <div style={{ display: 'flex', backgroundColor: '#0f291e', padding: '3px', borderRadius: '20px', border: '1px solid #2d523e' }}>
            {(['BK', 'PIKET', 'OSIS-MPK'] as RoleType[]).map((rKey) => (
              <button
                key={rKey}
                onClick={() => setRole(rKey)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: role === rKey ? profilRole[rKey].badgeColor : 'transparent',
                  color: role === rKey ? '#ffffff' : '#a7f3d0',
                  transition: 'all 0.2s ease'
                }}
              >
                {rKey}
              </button>
            ))}
          </div>
        </div>

        {/* PROFIL INFO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: profileAktif.color, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', border: '2px solid #ffffff' }}>
            {profileAktif.initial}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{profileAktif.nama}</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', fontStyle: 'italic' }}>{profileAktif.email}</div>
          </div>
        </div>
      </nav>

      {/* 📌 MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 16px' }}>

        {/* ========================================================================= */}
        {/* PANEL GURU BK                                                            */}
        {/* ========================================================================= */}
        {role === 'BK' && (
          <div>
            {/* STATISTIK BK - DENGAN GRADASI HALUS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #d1fae5', borderLeft: '5px solid #059669', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>CURHAT SISWA</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#064e3b', marginTop: '4px' }}>{dataCurhat.length} Pesan</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #f3e8ff', borderLeft: '5px solid #9333ea', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: '700', textTransform: 'uppercase' }}>IZIN & SAKIT</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#581c87', marginTop: '4px' }}>{dataIzinSakit.length} Izin</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #ccfbf1', borderLeft: '5px solid #0d9488', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: '700', textTransform: 'uppercase' }}>KONSELING</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#134e4a', marginTop: '4px' }}>{dataKonselingInd.length} Sesi</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #fef3c7', borderLeft: '5px solid #d97706', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>HOME VISIT</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '4px' }}>{dataHomeVisit.length} Agenda</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #ffe4e6', borderLeft: '5px solid #e11d48', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '11px', color: '#be123c', fontWeight: '700', textTransform: 'uppercase' }}>PANGGILAN ORTU</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#881337', marginTop: '4px' }}>{dataPanggilanOrtu.length} Surat</div>
              </div>
            </div>

            {/* TAB MENU BK */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
              {[
                { id: 'curhat', label: 'Curhat Siswa', icon: MessageSquareText },
                { id: 'izin_sakit', label: 'Izin & Sakit', icon: ClipboardList },
                { id: 'konseling_ind', label: 'Konseling Indv.', icon: UserCheck },
                { id: 'home_visit', label: 'Home Visit', icon: Home },
                { id: 'panggilan_ortu', label: 'Panggilan Ortu', icon: PhoneCall },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabBK(tab.id as any)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: tabBK === tab.id ? 'none' : '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: tabBK === tab.id 
                        ? 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)' 
                        : '#ffffff',
                      color: tabBK === tab.id ? '#ffffff' : '#334155',
                      boxShadow: tabBK === tab.id ? '0 3px 8px rgba(27,59,43,0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IconComponent size={15} color={tabBK === tab.id ? '#86efac' : '#64748b'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* KONTEN TAB BK */}
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>

              {/* TAB CURHAT */}
              {tabBK === 'curhat' && (
                <div>
                  <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Pesan Curhat dari Siswa</h3>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                          <th style={{ padding: '12px' }}>Pengirim / Kelas</th>
                          <th style={{ padding: '12px' }}>Judul Pesan</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Tujuan Konselor</th>
                          <th style={{ padding: '12px' }}>Status Response</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Aksi BK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataCurhat.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada pesan curhat yang masuk.</td></tr>
                        ) : (
                          dataCurhat.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px' }}>
                                {item.nama_siswa === 'Anonim' || item.nama_siswa === 'Siswa Rahasia (Anonim)' ? (
                                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid #e2e8f0' }}>Anonim</span>
                                ) : (
                                  <div>
                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.nama_siswa}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.kelas}</div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>{item.judul}</td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                              <td style={{ padding: '12px', color: '#475569' }}>{item.jenis}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ backgroundColor: item.status === 'Selesai' ? '#d1fae5' : '#fef3c7', color: item.status === 'Selesai' ? '#065f46' : '#92400e', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: item.status === 'Selesai' ? '1px solid #6ee7b7' : '1px solid #fcd34d' }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => { setModalCurhatDetail(item); setTextBalasan(item.balasan); }}
                                  style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <FolderOpen size={13} color="#86efac" />
                                  <span>Buka & Balas</span>
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
                  <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Surat Izin / Sakit Siswa</h3>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                          <th style={{ padding: '12px' }}>Kelas</th>
                          <th style={{ padding: '12px' }}>Nama Siswa</th>
                          <th style={{ padding: '12px' }}>Jenis Izin</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Keterangan</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Foto</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Aksi Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataIzinSakit.length === 0 ? (
                          <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada pengajuan izin atau sakit.</td></tr>
                        ) : (
                          dataIzinSakit.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.kelas}</td>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#334155' }}>{item.nama}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ backgroundColor: item.jenis === 'Sakit' ? '#fee2e2' : '#dbeafe', color: item.jenis === 'Sakit' ? '#991b1b' : '#1e40af', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: item.jenis === 'Sakit' ? '1px solid #fecdd3' : '1px solid #93c5fd' }}>
                                  {item.jenis}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                              <td style={{ padding: '12px', color: '#475569' }}>{item.keterangan}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                {item.foto ? (
                                  <button
                                    onClick={() => setPreviewFoto(item.foto)}
                                    style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Eye size={13} />
                                    <span>Lihat</span>
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Tanpa Foto</span>
                                )}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button onClick={() => handleUpdateStatusIzin(item.id, 'Disetujui')} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Setuju</button>
                                  <button onClick={() => handleUpdateStatusIzin(item.id, 'Ditolak')} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Tolak</button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Agenda Konseling Individual</h3>
                    <button onClick={() => setShowModalAddKonseling(true)} style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={15} color="#86efac" />
                      <span>Agendakan Konseling</span>
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                          <th style={{ padding: '12px' }}>Nama Siswa / Kelompok</th>
                          <th style={{ padding: '12px' }}>Tanggal / Jadwal</th>
                          <th style={{ padding: '12px' }}>Topik / Catatan</th>
                          <th style={{ padding: '12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataKonselingInd.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada agenda konseling.</td></tr>
                        ) : (
                          dataKonselingInd.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.nama}</td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                              <td style={{ padding: '12px', color: '#334155' }}>{item.topik}</td>
                              <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid #6ee7b7' }}>{item.status}</span></td>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Agenda Home Visit</h3>
                    <button onClick={() => setShowModalAddHomeVisit(true)} style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={15} color="#86efac" />
                      <span>Buat Home Visit</span>
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                          <th style={{ padding: '12px' }}>Nama Siswa</th>
                          <th style={{ padding: '12px' }}>Alamat</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Alasan</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataHomeVisit.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada agenda home visit.</td></tr>
                        ) : (
                          dataHomeVisit.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.nama}</td>
                              <td style={{ padding: '12px', color: '#475569' }}>{item.alamat}</td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                              <td style={{ padding: '12px', color: '#334155' }}>{item.alasan}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => setPreviewSurat({ judul: `SURAT TUGAS HOME VISIT - ${item.nama}`, detail: `Petugas BK ditugaskan mengunjungi tempat tinggal ${item.nama} di ${item.alamat} pada tanggal ${item.tanggal} dikarenakan: ${item.alasan}.` })} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <Printer size={13} />
                                  <span>Surat</span>
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

              {/* TAB PANGGILAN ORTU */}
              {tabBK === 'panggilan_ortu' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Pemanggilan Orang Tua</h3>
                    <button onClick={() => setShowModalAddOrtu(true)} style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={15} color="#86efac" />
                      <span>Buat Surat Panggilan</span>
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                          <th style={{ padding: '12px' }}>Nama Siswa</th>
                          <th style={{ padding: '12px' }}>Orang Tua</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Alasan</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataPanggilanOrtu.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada panggilan orang tua.</td></tr>
                        ) : (
                          dataPanggilanOrtu.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.nama}</td>
                              <td style={{ padding: '12px', color: '#475569' }}>{item.ortu}</td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                              <td style={{ padding: '12px', color: '#334155' }}>{item.alasan}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => setPreviewSurat({ judul: `SURAT PEMANGGILAN ORANG TUA - ${item.nama}`, detail: `Kepada Yth. ${item.ortu}, Mengharap kehadiran Bapak/Ibu pada tanggal ${item.tanggal} di ruang BK SMK Budi Bakti Ciwidey terkait: ${item.alasan}.` })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <Printer size={13} />
                                  <span>Surat</span>
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

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL GURU PIKET                                                         */}
        {/* ========================================================================= */}
        {role === 'PIKET' && (
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px', color: '#d97706' }}>
                <Clock size={20} />
              </div>
              <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Catatan Keterlambatan Siswa (Guru Piket: {profileAktif.nama})</h3>
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #1b3b2b 0%, #244e39 100%)', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Jam Datang</th>
                    <th style={{ padding: '12px' }}>Alasan Terlambat</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Cetak Izin Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTerlambat.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data keterlambatan siswa.</td></tr>
                  ) : (
                    dataTerlambat.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.nama_siswa || item.nama}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.kelas}</td>
                        <td style={{ padding: '12px', color: '#dc2626', fontWeight: '700' }}>{item.jam_datang || item.jam}</td>
                        <td style={{ padding: '12px', color: '#334155' }}>{item.alasan}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => setPreviewSurat({ judul: `SURAT IZIN MASUK KELAS - ${item.nama_siswa || item.nama}`, detail: `Siswa bernama ${item.nama_siswa || item.nama} (${item.kelas}) telah melapor ke Piket pada jam ${item.jam_datang || item.jam} dengan alasan: ${item.alasan}. Diberikan izin masuk kelas.` })}
                            style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <Printer size={13} color="#86efac" />
                            <span>Cetak Surat Masuk</span>
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
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #fbcfe8', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#831843', fontSize: '16px', fontWeight: '700' }}>Panel Peer Counselor & Kedisiplinan OSIS & MPK</h3>
                <p style={{ fontSize: '11px', color: '#9d174d', margin: '2px 0 0 0', fontWeight: '500' }}>Petugas: {profileAktif.nama}</p>
              </div>
              <button
                onClick={() => setShowModalAddPelanggaran(true)}
                style={{ background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 8px rgba(190, 24, 93, 0.2)' }}
              >
                <Camera size={15} />
                <span>Catat Pelanggaran Gerbang</span>
              </button>
            </div>

            {/* TABEL 1: CURHATAN SISWA */}
            <h4 style={{ color: '#be185d', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>Curhatan Masuk ke Peer Counselor</h4>
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '24px' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #be185d 0%, #9d174d 100%)', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Judul Curhatan</th>
                    <th style={{ padding: '12px' }}>Tanggal</th>
                    <th style={{ padding: '12px' }}>Tujuan</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi Peer Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {dataCurhat.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada curhatan dari siswa.</td></tr>
                  ) : (
                    dataCurhat.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #fbcfe8' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.judul}</td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.jenis}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: item.status === 'Selesai' ? '#d1fae5' : '#fce7f3', color: item.status === 'Selesai' ? '#065f46' : '#be185d', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: item.status === 'Selesai' ? '1px solid #6ee7b7' : '1px solid #fbcfe8' }}>{item.status}</span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => { setModalCurhatDetail(item); setTextBalasan(item.balasan); }}
                            style={{ backgroundColor: '#be185d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Buka & Balas
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 2: PENGAWASAN IZIN & SAKIT SISWA */}
            <h4 style={{ color: '#6d28d9', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>Pengawasan Izin & Sakit Siswa</h4>
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '24px' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #5b21b6 100%)', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Jenis Izin</th>
                    <th style={{ padding: '12px' }}>Tanggal</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataIzinSakit.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada pengawasan izin siswa.</td></tr>
                  ) : (
                    dataIzinSakit.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #ddd6fe' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.kelas}</td>
                        <td style={{ padding: '12px', color: '#334155' }}>{item.nama}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.jenis}</td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{item.tanggal}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#ede9fe', color: '#5b21b6', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid #c4b5fd' }}>{item.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 3: RIWAYAT PELANGGARAN YANG DICATAT OSIS & MPK */}
            <h4 style={{ color: '#be185d', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>Rekap Laporan Pelanggaran Kedisiplinan Siswa Hasil Patroli</h4>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(90deg, #831843 0%, #500724 100%)', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa / Kelas</th>
                    <th style={{ padding: '12px' }}>Jenis Pelanggaran</th>
                    <th style={{ padding: '12px' }}>Poin</th>
                    <th style={{ padding: '12px' }}>Pelapor</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Foto Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPelanggaran.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada pelanggaran yang dicatat.</td></tr>
                  ) : (
                    dataPelanggaran.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #fbcfe8' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{item.nama_siswa} ({item.kelas})</td>
                        <td style={{ padding: '12px', color: '#334155' }}>{item.jenis_pelanggaran}</td>
                        <td style={{ padding: '12px', color: '#dc2626', fontWeight: '700' }}>+{item.poin} Poin</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.pelapor}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {item.foto_url ? (
                            <button onClick={() => setPreviewFoto(item.foto_url)} style={{ backgroundColor: '#be185d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={13} />
                              <span>Lihat Foto</span>
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>Tanpa Foto</span>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', maxWidth: '500px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} />
                <span>Catat Pelanggaran Gerbang</span>
              </h3>
              <button
                type="button"
                onClick={() => { setShowModalAddPelanggaran(false); stopCamera(); }}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpanPelanggaran} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                  Petugas Pelapor / Pencatat:
                </label>
                <select
                  value={formPelanggaran.pelapor || `Petugas (${role})`}
                  onChange={(e) => setFormPelanggaran({ ...formPelanggaran, pelapor: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                >
                  <option value={`Petugas (${role})`}>Petugas ({role})</option>
                  <option value={`Tim ${role} Kedisiplinan`}>Tim {role} Kedisiplinan</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    Kelas:
                  </label>
                  <select
                    value={formPelanggaran.kelas}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, kelas: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                  >
                    <option value="X BRP 1">X BRP 1</option>
                    <option value="X BRP 2">X BRP 2</option>
                    <option value="XI AKL 1">XI AKL 1</option>
                    <option value="XII MPLB 1">XII MPLB 1</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    Nama Siswa:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Siswa"
                    value={formPelanggaran.nama_siswa}
                    onChange={(e) => setFormPelanggaran({ ...formPelanggaran, nama_siswa: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                  Pilih Pelanggaran:
                </label>
                <input
                  type="text"
                  placeholder="Cari jenis pelanggaran..."
                  value={searchPelanggaran}
                  onChange={(e) => setSearchPelanggaran(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #059669', fontSize: '13px', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }}
                />

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', backgroundColor: '#f8fafc' }}>
                  {filteredPelanggaranList.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormPelanggaran({ ...formPelanggaran, jenis_pelanggaran: p.text, poin: p.poin.toString() })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: formPelanggaran.jenis_pelanggaran === p.text ? '#fef2f2' : '#ffffff',
                        border: `1px solid ${formPelanggaran.jenis_pelanggaran === p.text ? '#ef4444' : '#e2e8f0'}`,
                        color: formPelanggaran.jenis_pelanggaran === p.text ? '#991b1b' : '#334155'
                      }}
                    >
                      <span>{p.text}</span>
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>+{p.poin} Pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                  Catatan Detail:
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Datang jam 07:20..."
                  value={formPelanggaran.keterangan}
                  onChange={(e) => setFormPelanggaran({ ...formPelanggaran, keterangan: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
                />
              </div>

              {/* BUKTI FOTO & KAMERA INTEGRATION */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1.5px dashed #059669' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} />
                  <span>Bukti Foto Pelanggaran:</span>
                </label>

                {!isCameraActive && !previewFotoPelanggaran && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ flex: 1, padding: '9px 8px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <Camera size={14} />
                        <span>Kamera HP</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        style={{ flex: 1, padding: '9px 8px', background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Webcam Live
                      </button>
                    </div>
                    <label style={{ padding: '8px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <Upload size={14} />
                      <span>Upload Galeri</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {isCameraActive && (
                  <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                    <div style={{ padding: '8px', display: 'flex', justifyContent: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <button type="button" onClick={takePhoto} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>Jepret</button>
                      <button type="button" onClick={stopCamera} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>Batal</button>
                    </div>
                  </div>
                )}

                {previewFotoPelanggaran && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={previewFotoPelanggaran} alt="Preview Bukti" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #059669', backgroundColor: '#000' }} />
                    <button type="button" onClick={() => setPreviewFotoPelanggaran(null)} style={{ marginTop: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Hapus Foto</button>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowModalAddPelanggaran(false); stopCamera(); }} style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(220,38,38,0.2)' }}>Simpan Catatan</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL BALAS CURHAT */}
      {modalCurhatDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '450px', width: '95%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '16px', fontWeight: '700' }}>Detail Curhat Siswa</h3>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', border: '1px solid #e2e8f0', lineHeight: '1.5' }}>
              <strong>Pengirim:</strong> {modalCurhatDetail.nama_siswa} ({modalCurhatDetail.kelas})<br />
              <strong>Judul:</strong> {modalCurhatDetail.judul} <br />
              <strong>Pesan:</strong> "{modalCurhatDetail.isi}"
            </div>

            <textarea value={textBalasan} onChange={(e) => setTextBalasan(e.target.value)} rows={4} placeholder="Ketik jawaban konseling di sini..." style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button onClick={() => setModalCurhatDetail(null)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleBalasCurhat} style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 3px 8px rgba(27,59,43,0.2)' }}>Kirim Balasan</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL PREVIEW FOTO */}
      {previewFoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', maxWidth: '450px', width: '95%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '15px', fontWeight: '700' }}>Lampiran Foto Bukti</h3>
            <img src={previewFoto} alt="Bukti Foto" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
            <button onClick={() => setPreviewFoto(null)} style={{ marginTop: '14px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Tutup</button>
          </div>
        </div>
      )}

      {/* 4. MODAL KONSELING */}
      {showModalAddKonseling && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '95%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '16px', fontWeight: '700' }}>Agendakan Konseling</h3>
            <form onSubmit={handleSimpanKonseling}>
              <input required placeholder="Nama Siswa & Kelas" value={formKonseling.nama} onChange={(e) => setFormKonseling({ ...formKonseling, nama: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Tanggal Pelaksanaan" value={formKonseling.tanggal} onChange={(e) => setFormKonseling({ ...formKonseling, tanggal: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Topik Masalah" value={formKonseling.topik} onChange={(e) => setFormKonseling({ ...formKonseling, topik: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddKonseling(false)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Batal</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL HOME VISIT */}
      {showModalAddHomeVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '95%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '16px', fontWeight: '700' }}>Buat Home Visit</h3>
            <form onSubmit={handleSimpanHomeVisit}>
              <input required placeholder="Nama Siswa & Kelas" value={formHomeVisit.nama} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, nama: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Alamat Rumah" value={formHomeVisit.alamat} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alamat: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Tanggal Visit" value={formHomeVisit.tanggal} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, tanggal: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Alasan Visit" value={formHomeVisit.alasan} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alasan: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddHomeVisit(false)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Batal</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL PANGGILAN ORTU */}
      {showModalAddOrtu && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '95%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '16px', fontWeight: '700' }}>Buat Panggilan Orang Tua</h3>
            <form onSubmit={handleSimpanPanggilanOrtu}>
              <input required placeholder="Nama Siswa & Kelas" value={formOrtu.nama} onChange={(e) => setFormOrtu({ ...formOrtu, nama: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Nama Orang Tua / Wali" value={formOrtu.ortu} onChange={(e) => setFormOrtu({ ...formOrtu, ortu: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Tanggal Pertemuan" value={formOrtu.tanggal} onChange={(e) => setFormOrtu({ ...formOrtu, tanggal: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <input required placeholder="Alasan Pemanggilan" value={formOrtu.alasan} onChange={(e) => setFormOrtu({ ...formOrtu, alasan: e.target.value })} style={{ width: '100%', padding: '10px 12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddOrtu(false)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Batal</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL PREVIEW SURAT */}
      {previewSurat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '95%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', color: '#059669' }}>
              <FileText size={36} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b', fontSize: '16px', fontWeight: '700' }}>{previewSurat.judul}</h3>
            <p style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.6', textAlign: 'left', color: '#334155' }}>
              {previewSurat.detail}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '18px' }}>
              <button onClick={() => setPreviewSurat(null)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Tutup</button>
              <button onClick={() => { alert('Mencetak surat...'); setPreviewSurat(null); }} style={{ background: 'linear-gradient(135deg, #1b3b2b 0%, #2d523e 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={14} color="#86efac" />
                <span>Cetak Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}