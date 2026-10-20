'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { getServerThemeSnapshot, getThemeSnapshot, subscribeToTheme } from '@/lib/theme';

type StudentSession = {
  nama: string;
  email: string;
  kelas: string;
};

type StudentServiceHistory = {
  id: number | string;
  layanan?: string;
  status?: string;
  judul_pesan?: string;
  jenis_izin?: string;
  pesan?: string;
  keterangan?: string;
  balasan?: string;
};

type StudentViolation = {
  id: number | string;
  nama_siswa?: string;
  kelas?: string;
  tanggal?: string;
  jam_kejadian?: string;
  jenis_pelanggaran?: string;
  jenis?: string;
  kategori?: string;
  poin?: number | string;
  keterangan?: string;
  tindakan?: string;
  pencatat?: string;
  created_at?: string;
};

const subscribeToStudentSession = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getStudentSessionSnapshot = () => window.sessionStorage.getItem('siswa_session');
const getServerStudentSessionSnapshot = () => null;

const parseStudentSession = (rawSession: string | null): StudentSession | null => {
  if (!rawSession) return null;

  try {
    const parsed: unknown = JSON.parse(rawSession);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

    const session = parsed as Record<string, unknown>;
    if (
      typeof session.nama !== 'string' ||
      typeof session.email !== 'string' ||
      typeof session.kelas !== 'string'
    ) {
      return null;
    }

    return { nama: session.nama, email: session.email, kelas: session.kelas };
  } catch {
    return null;
  }
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const rawSession = useSyncExternalStore(
    subscribeToStudentSession,
    getStudentSessionSnapshot,
    getServerStudentSessionSnapshot
  );
  const siswa = useMemo(() => parseStudentSession(rawSession), [rawSession]);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  // TAB NAVIGATION SISWA
  const [activeTab, setActiveTab] = useState<'curhat' | 'izin' | 'riwayat' | 'pelanggaran'>('curhat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM CURHAT (DENGAN OPSIONAL ANONIM VIA EMAIL SISWA)
  const [formCurhat, setFormCurhat] = useState({
    isAnonim: false,
    tujuan: 'Guru BK',
    judul: '',
    pesan: ''
  });

  // FORM IZIN / SAKIT
  const [formIzin, setFormIzin] = useState({
    jenis: 'Sakit',
    keterangan: ''
  });
  const [previewFotoIzin, setPreviewFotoIzin] = useState<string | null>(null);

  // RIWAYAT DATA SISWA
  const [myHistory, setMyHistory] = useState<StudentServiceHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [myViolations, setMyViolations] = useState<StudentViolation[]>([]);
  const [isLoadingViolations, setIsLoadingViolations] = useState(true);
  const [violationError, setViolationError] = useState('');

  // KAMERA REF & STATE
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleLogout = () => {
    sessionStorage.removeItem('siswa_session');
    router.push('/');
  };

  // FETCH RIWAYAT BERDASARKAN EMAIL SISWA YANG LOGIN
  const fetchMyHistory = useCallback(async (emailSiswa: string, showLoading = false) => {
    if (showLoading) setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('email_siswa', emailSiswa)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyHistory((data || []) as StudentServiceHistory[]);
    } catch (error) {
      console.error('Gagal mengambil riwayat layanan siswa:', error);
      setMyHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const fetchMyViolations = useCallback(async (student: StudentSession, showLoading = false) => {
    if (!student.nama || !student.kelas) {
      setMyViolations([]);
      setViolationError('Identitas nama dan kelas belum tersedia di sesi siswa.');
      setIsLoadingViolations(false);
      return;
    }

    if (showLoading) setIsLoadingViolations(true);
    setViolationError('');
    try {
      const { data, error } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .eq('nama_siswa', student.nama)
        .eq('kelas', student.kelas)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyViolations((data || []) as StudentViolation[]);
    } catch (err) {
      console.error('Gagal mengambil riwayat pelanggaran siswa:', err);
      setMyViolations([]);
      setViolationError('Riwayat pelanggaran gagal dimuat. Silakan coba lagi.');
    } finally {
      setIsLoadingViolations(false);
    }
  }, []);

  // VERIFIKASI SESI SISWA
  useEffect(() => {
    if (!rawSession) {
      if (!sessionStorage.getItem('siswa_session')) router.push('/');
      return;
    }

    if (!siswa) {
      console.error('Sesi siswa tidak valid atau tidak lengkap.');
      router.push('/');
      return;
    }

    queueMicrotask(() => {
      void fetchMyHistory(siswa.email);
      void fetchMyViolations(siswa);
    });
  }, [fetchMyHistory, fetchMyViolations, rawSession, router, siswa]);

  // KAMERA LOGIC
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Kamera browser tidak diizinkan. Silakan gunakan tombol Galeri!');
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
        setPreviewFotoIzin(canvas.toDataURL('image/jpeg', 0.8));
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewFotoIzin(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // SUBMIT CURHAT (ANONIM TERIKAT KE EMAIL SISWA)
  const handleSubmitCurhat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswa) return;
    if (!formCurhat.judul || !formCurhat.pesan) return alert('Isi judul dan pesan curhat!');

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('layanan_siswa').insert([{
        layanan: 'CURHAT',
        nama_siswa: formCurhat.isAnonim ? 'Siswa Rahasia (Anonim)' : siswa.nama,
        email_siswa: siswa.email, // SELALU DITERUSKAN SEBAGAI IDENTITAS RESMI DIBALIK LAYAR
        kelas: formCurhat.isAnonim ? '-' : siswa.kelas,
        judul_pesan: formCurhat.judul,
        pesan: formCurhat.pesan,
        tujuan_konselor: formCurhat.tujuan,
        status: 'TERKIRIM',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      alert(formCurhat.isAnonim ? '🔒 Curhatan Anonim berhasil dikirim! Nama disamarkan, namun terikat ke email akunmu.' : '✅ Curhatan kamu berhasil terkirim!');
      setFormCurhat({ isAnonim: false, tujuan: 'Guru BK', judul: '', pesan: '' });
      void fetchMyHistory(siswa.email, true);
    } catch (error: unknown) {
      alert('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMIT IZIN / SAKIT
  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswa) return;
    if (!formIzin.keterangan) return alert('Isi alasan izin/sakit!');

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('layanan_siswa').insert([{
        layanan: 'IZIN',
        nama_siswa: siswa.nama,
        email_siswa: siswa.email,
        kelas: siswa.kelas,
        jenis_izin: formIzin.jenis,
        pesan: formIzin.keterangan,
        foto_bukti: previewFotoIzin,
        status: 'Menunggu Tanggapan',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      alert('✅ Pengajuan surat izin/sakit berhasil dikirim!');
      setFormIzin({ jenis: 'Sakit', keterangan: '' });
      setPreviewFotoIzin(null);
      stopCamera();
      void fetchMyHistory(siswa.email, true);
    } catch (error: unknown) {
      alert('❌ Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!siswa) return null;

  return (
    <div className="student-dashboard" data-theme={theme} style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937', paddingBottom: '40px' }}>
      <style jsx global>{`
        .student-dashboard[data-theme='dark'] {
          background-color: #071c16 !important;
          color: #e5e7eb !important;
        }

        .student-dashboard[data-theme='dark'] .student-card {
          background-color: #10291f !important;
          border-color: #285240 !important;
          color: #e5e7eb !important;
        }

        .student-dashboard[data-theme='dark'] .student-subcard {
          background-color: #173629 !important;
          border-color: #315b45 !important;
        }

        .student-dashboard[data-theme='dark'] .student-card :not(button):not(span):not(input):not(textarea):not(select) {
          color: #e5e7eb !important;
        }

        .student-dashboard[data-theme='dark'] main input:not([type='checkbox']):not([type='file']),
        .student-dashboard[data-theme='dark'] main textarea,
        .student-dashboard[data-theme='dark'] main select {
          background-color: #0b2119 !important;
          border-color: #456454 !important;
          color: #f3f4f6 !important;
        }

        .student-dashboard[data-theme='dark'] main input::placeholder,
        .student-dashboard[data-theme='dark'] main textarea::placeholder {
          color: #9ca3af !important;
        }

        .student-dashboard[data-theme='dark'] .student-tab:not([data-active='true']) {
          background-color: #173629 !important;
          color: #d1fae5 !important;
        }

        .student-dashboard[data-theme='dark'] .student-tab[data-active='true'] {
          background-color: #047857 !important;
          color: #ffffff !important;
        }

        .student-dashboard[data-theme='dark'] .student-refresh {
          background-color: #173629 !important;
          border-color: #315b45 !important;
          color: #d1fae5 !important;
        }

        .student-dashboard[data-theme='dark'] [role='alert'] {
          background-color: #451a1a !important;
          border-color: #7f1d1d !important;
        }
      `}</style>
      
      {/* NAVBAR DENGAN PROFIL SISWA */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>MindGuard - Panel Siswa</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>SMK Budi Bakti Ciwidey</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>👤 {siswa.nama} ({siswa.kelas})</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>📧 {siswa.email}</div>
          </div>
          <ThemeToggle compact />
          <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
            🚪 Keluar
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '650px', margin: '20px auto', padding: '0 12px' }}>
        
        {/* TAB BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '16px' }}>
          <button className="student-tab" data-active={activeTab === 'curhat'} onClick={() => setActiveTab('curhat')} style={{ padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: activeTab === 'curhat' ? '#1b3b2b' : '#ffffff', color: activeTab === 'curhat' ? '#ffffff' : '#1b3b2b' }}>
            💭 Curhat Siswa
          </button>
          <button className="student-tab" data-active={activeTab === 'izin'} onClick={() => setActiveTab('izin')} style={{ padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: activeTab === 'izin' ? '#1b3b2b' : '#ffffff', color: activeTab === 'izin' ? '#ffffff' : '#1b3b2b' }}>
            📝 Surat Izin/Sakit
          </button>
          <button className="student-tab" data-active={activeTab === 'riwayat'} onClick={() => setActiveTab('riwayat')} style={{ padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: activeTab === 'riwayat' ? '#1b3b2b' : '#ffffff', color: activeTab === 'riwayat' ? '#ffffff' : '#1b3b2b' }}>
            📜 Riwayat Saya ({myHistory.length})
          </button>
          <button className="student-tab" data-active={activeTab === 'pelanggaran'} onClick={() => { setActiveTab('pelanggaran'); void fetchMyViolations(siswa, true); }} style={{ padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', backgroundColor: activeTab === 'pelanggaran' ? '#1b3b2b' : '#ffffff', color: activeTab === 'pelanggaran' ? '#ffffff' : '#1b3b2b' }}>
            🚨 Pelanggaran ({myViolations.length})
          </button>
        </div>

        {/* TAB 1: FORM CURHAT */}
        {activeTab === 'curhat' && (
          <div className="student-card" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1b3b2b', fontSize: '16px' }}>💭 Kirim Curhatan / Konseling</h3>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 14px 0' }}>Sampaikan apa yang sedang kamu rasakan pada Guru BK atau OSIS.</p>

            <form onSubmit={handleSubmitCurhat} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* OPSI ANONIM VIA EMAIL SISWA */}
              <div className="student-subcard" style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1.5px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    id="anonim"
                    checked={formCurhat.isAnonim}
                    onChange={(e) => setFormCurhat({ ...formCurhat, isAnonim: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="anonim" style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', cursor: 'pointer' }}>
                    🔒 Kirim Secara Anonim (Sembunyikan Nama Kamu)
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: '#15803d', paddingLeft: '26px', lineHeight: '1.4' }}>
                  Nama dan kelas kamu akan disamarkan menjadi <i>&quot;Siswa Rahasia&quot;</i> di laporan, tetapi curhatan ini tetap resmi terhubung ke Email Siswa kamu (<code>{siswa.email}</code>).
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tujuan Konselor:</label>
                <select value={formCurhat.tujuan} onChange={(e) => setFormCurhat({ ...formCurhat, tujuan: e.target.value })} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: '#fff' }}>
                  <option value="Guru BK">👩‍🏫 Guru BK (Bu Hj Eli, S.Pd)</option>
                  <option value="Peer Konseling OSIS">🤝 Peer Counselor OSIS</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Judul Masalah:</label>
                <input type="text" required placeholder="Judul singkat..." value={formCurhat.judul} onChange={(e) => setFormCurhat({ ...formCurhat, judul: e.target.value })} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Isi Curhatan Detail:</label>
                <textarea required rows={4} placeholder="Tuliskan curhatanmu..." value={formCurhat.pesan} onChange={(e) => setFormCurhat({ ...formCurhat, pesan: e.target.value })} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '11px', backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                {isSubmitting ? '⌛ Mengirim...' : '🚀 Kirim Curhatan'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: FORM IZIN / SAKIT */}
        {activeTab === 'izin' && (
          <div className="student-card" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1b3b2b', fontSize: '16px' }}>📝 Pengajuan Surat Izin / Sakit</h3>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 14px 0' }}>Data izin dikirim langsung menggunakan identitas akun siswa kamu.</p>

            <form onSubmit={handleSubmitIzin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Jenis Izin:</label>
                <select value={formIzin.jenis} onChange={(e) => setFormIzin({ ...formIzin, jenis: e.target.value })} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: '#fff' }}>
                  <option value="Sakit">🤒 Sakit</option>
                  <option value="Izin Meminta Keterangan">✉️ Izin Acara / Kepentingan</option>
                  <option value="Dispensasi Sekolah">🏆 Dispensasi Lomba</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Alasan / Keterangan:</label>
                <textarea required rows={3} placeholder="Tuliskan alasan..." value={formIzin.keterangan} onChange={(e) => setFormIzin({ ...formIzin, keterangan: e.target.value })} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              {/* FOTO / KAMERA */}
              <div className="student-subcard" style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1.5px dashed #059669' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#065f46', marginBottom: '6px' }}>📷 Lampiran Foto Dokter / Surat Izin:</label>
                {!isCameraActive && !previewFotoIzin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <label style={{ flex: 1, padding: '8px', backgroundColor: '#059669', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' }}>
                      📸 Kamera HP
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button type="button" onClick={startCamera} style={{ flex: 1, padding: '8px', backgroundColor: '#1b3b2b', color: '#fff', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>💻 Webcam</button>
                  </div>
                )}
                {isCameraActive && (
                  <div style={{ textAlign: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px' }} />
                    <button type="button" onClick={takePhoto} style={{ marginTop: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>⚪ Ambil Foto</button>
                  </div>
                )}
                {previewFotoIzin && (
                  <div style={{ textAlign: 'center' }}>
                    <Image src={previewFotoIzin} alt="Bukti Foto" width={650} height={160} unoptimized style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', border: '2px solid #059669' }} />
                    <button type="button" onClick={() => setPreviewFotoIzin(null)} style={{ marginTop: '4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>Hapus Foto</button>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '11px', backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                {isSubmitting ? '⌛ Mengirim...' : '📤 Kirim Surat Izin'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: RIWAYAT LAYANAN SAYA */}
        {activeTab === 'riwayat' && (
          <div className="student-card" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1b3b2b', fontSize: '16px' }}>📜 Riwayat & Status Layanan Kamu</h3>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 14px 0' }}>Otomatis memuat semua pengajuan yang terikat pada email: <b>{siswa.email}</b></p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: '#6b7280' }}>⌛ Memuat data...</div>
              ) : myHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>Belum ada riwayat pengajuan layanan.</div>
              ) : (
                myHistory.map((item) => (
                  <div className="student-subcard" key={item.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.layanan || 'LAYANAN'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: item.status === 'Disetujui' || item.status === 'Selesai' ? '#065f46' : '#92400e', backgroundColor: item.status === 'Disetujui' || item.status === 'Selesai' ? '#d1fae5' : '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.status || 'Diproses'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>{item.judul_pesan || item.jenis_izin}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0 6px 0' }}>{item.pesan || item.keterangan}</div>

                    {item.balasan && (
                      <div className="student-subcard" style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', marginTop: '6px', fontSize: '11px' }}>
                        <strong style={{ color: '#166534' }}>💬 Balasan Konselor:</strong>
                        <p style={{ margin: '2px 0 0 0', color: '#14532d' }}>&quot;{item.balasan}&quot;</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'pelanggaran' && (
          <div className="student-card" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #b5d8b6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1b3b2b', fontSize: '16px' }}>🚨 Riwayat Pelanggaran Kamu</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Catatan pelanggaran yang dicatat oleh petugas/Guru BK untuk {siswa.nama} ({siswa.kelas}).</p>
              </div>
              <button className="student-refresh" type="button" onClick={() => void fetchMyViolations(siswa, true)} disabled={isLoadingViolations} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #b5d8b6', backgroundColor: '#f0fdf4', color: '#1b3b2b', fontSize: '11px', fontWeight: 'bold', cursor: isLoadingViolations ? 'wait' : 'pointer' }}>
                {isLoadingViolations ? '⌛ Memuat...' : '🔄 Refresh'}
              </button>
            </div>

            {violationError ? (
              <div role="alert" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px' }}>
                {violationError}
              </div>
            ) : isLoadingViolations ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '12px' }}>⌛ Memuat riwayat pelanggaran...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div className="student-subcard" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '10px', color: '#166534', fontWeight: 'bold' }}>TOTAL POIN PELANGGARAN</div>
                    <div style={{ marginTop: '4px', fontSize: '22px', color: '#14532d', fontWeight: 'bold' }}>
                      {myViolations.reduce((total, item) => total + (Number(item.poin) || 0), 0)} Poin
                    </div>
                  </div>
                  <div className="student-subcard" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>JUMLAH CATATAN</div>
                    <div style={{ marginTop: '4px', fontSize: '22px', color: '#1f2937', fontWeight: 'bold' }}>{myViolations.length} Catatan</div>
                  </div>
                </div>

                {myViolations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '12px' }}>Belum ada catatan pelanggaran untuk akunmu.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myViolations.map((item, index) => (
                      <div className="student-subcard" key={item.id || `${item.created_at}-${index}`} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>{item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>{item.kategori || 'Tanpa kategori'}</div>
                          </div>
                          <span style={{ whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 'bold', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '5px 8px', borderRadius: '6px' }}>+{Number(item.poin) || 0} Poin</span>
                        </div>
                        {(item.keterangan || item.tindakan) && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563' }}>
                            {item.keterangan && <div><strong>Keterangan:</strong> {item.keterangan}</div>}
                            {item.tindakan && <div style={{ marginTop: '3px' }}><strong>Tindakan:</strong> {item.tindakan}</div>}
                          </div>
                        )}
                        <div style={{ marginTop: '8px', paddingTop: '7px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#6b7280' }}>
                          📅 {item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-')}
                          {item.jam_kejadian ? ` • ${item.jam_kejadian}` : ''}
                          {' • '}Petugas: {item.pencatat || 'Guru BK/OSIS'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>

    </div>
  );
}