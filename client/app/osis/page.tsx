'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Send, AlertTriangle, Camera, User, X, CheckCircle2, ScanFace, SwitchCamera } from 'lucide-react';

type MasterPelanggaranItem = {
  id?: number | string;
  nama_pelanggaran?: string;
  nama?: string;
  jenis_pelanggaran?: string;
  jenis?: string;
  kategori?: string;
  poin?: number | string;
};

type PelanggaranSiswaItem = {
  id: string | number;
  nama_siswa: string;
  kelas: string;
  tanggal: string;
  jam_kejadian: string;
  jenis_pelanggaran: string;
  kategori?: string;
  poin: number;
  keterangan?: string;
  tindakan: string;
  pencatat: string;
  foto_bukti_path?: string | null;
  created_at?: string;
};

type CameraMode = 'face' | 'evidence';

type FaceApiRuntime = {
  nets: {
    tinyFaceDetector: { loadFromUri: (url: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (url: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (url: string) => Promise<void> };
  };
  TinyFaceDetectorOptions: new (options?: { inputSize?: number; scoreThreshold?: number }) => object;
  detectSingleFace: (image: HTMLCanvasElement | HTMLImageElement, options: object) => {
    withFaceLandmarks: () => {
      withFaceDescriptor: () => Promise<{ descriptor: Float32Array } | undefined>;
    };
  };
  euclideanDistance: (first: Float32Array, second: Float32Array) => number;
};

declare global {
  interface Window {
    faceapi?: FaceApiRuntime;
  }
}

let faceApiPromise: Promise<FaceApiRuntime> | null = null;
let faceModelsPromise: Promise<void> | null = null;
const faceDescriptorCache = new Map<string, Float32Array>();

const loadFaceApi = async () => {
  if (!faceApiPromise) {
    faceApiPromise = new Promise<FaceApiRuntime>((resolve, reject) => {
      if (window.faceapi) {
        resolve(window.faceapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';
      script.async = true;
      script.onload = () => window.faceapi ? resolve(window.faceapi) : reject(new Error('Library verifikasi wajah tidak tersedia.'));
      script.onerror = () => reject(new Error('Library verifikasi wajah gagal dimuat. Periksa koneksi internet.'));
      document.head.appendChild(script);
    }).catch((error) => {
      faceApiPromise = null;
      throw error;
    });
  }

  const faceapi = await faceApiPromise;
  if (!faceModelsPromise) {
    const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
    faceModelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
    ]).then(() => undefined).catch((error) => {
      faceModelsPromise = null;
      throw error;
    });
  }
  await faceModelsPromise;
  return faceapi;
};

const getFaceDescriptor = async (faceapi: FaceApiRuntime, image: HTMLCanvasElement | HTMLImageElement) => {
  const result = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result?.descriptor ?? null;
};

const loadReferenceImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Foto referensi siswa tidak dapat dibuka.'));
  image.src = src;
});

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

  // Foto Siswa & State Verifikasi Wajah
  const [fotoSiswa, setFotoSiswa] = useState<string | null>(null);
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [dbFotoUrl, setDbFotoUrl] = useState<string | null>(null);
  const [referenceStatus, setReferenceStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [cameraMessage, setCameraMessage] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('face');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [siswaByKelas, setSiswaByKelas] = useState<{ [kelas: string]: string[] }>({});

  const [masterPelanggaranList] = useState<MasterPelanggaranItem[]>(GERBANG_MASTER_PELANGGARAN);
  const [selectedPelanggaran, setSelectedPelanggaran] = useState<string>(GERBANG_MASTER_PELANGGARAN[0].nama_pelanggaran || '');
  const [selectedKategori, setSelectedKategori] = useState<string>(GERBANG_MASTER_PELANGGARAN[0].kategori || 'Keterlambatan');
  const [selectedPoin, setSelectedPoin] = useState<number>(Number(GERBANG_MASTER_PELANGGARAN[0].poin ?? 5));

  const [listPelanggaran, setListPelanggaran] = useState<PelanggaranSiswaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-fill Nama Petugas
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.nama) {
          const cleanName = session.nama.replace(/\s*\(.*?\)\s*/g, '').trim();
          setNamaPetugas(cleanName);
        }
      } catch (err) {
        console.error('Gagal membaca user_session:', err);
      }
    }
  }, []);

  // Fetch & Parse CSV DATAMURIDPROYEK.csv
  useEffect(() => {
    fetch('/DATAMURIDPROYEK.csv')
      .then((res) => {
        if (!res.ok) throw new Error('File CSV tidak ditemukan');
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
          const order: { [key: string]: number } = { X: 1, XI: 2, XII: 3 };
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

  useEffect(() => {
    let cancelled = false;

    const fetchFotoSiswa = async () => {
      if (!namaSiswa) {
        setDbFotoUrl(null);
        setReferenceStatus('missing');
        return;
      }

      setDbFotoUrl(null);
      setReferenceStatus('loading');
      try {
        const { data, error } = await supabase
          .from('master_foto_siswa')
          .select('foto_url')
          .ilike('nama_siswa', namaSiswa.trim())
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data?.foto_url) {
          if (!cancelled) setReferenceStatus('missing');
          return;
        }

        const storedPhoto = String(data.foto_url).trim();
        let photoUrl = storedPhoto;
        if (!/^https?:\/\//i.test(storedPhoto)) {
          const storagePath = storedPhoto.replace(/^\/?foto-siswaq\//i, '');
          const { data: signedPhoto, error: signedUrlError } = await supabase.storage
            .from('foto-siswaq')
            .createSignedUrl(storagePath, 3600);

          if (!signedUrlError && signedPhoto?.signedUrl) {
            photoUrl = signedPhoto.signedUrl;
          } else {
            photoUrl = supabase.storage.from('foto-siswaq').getPublicUrl(storagePath).data.publicUrl;
          }
        }

        if (!cancelled) {
          setDbFotoUrl(photoUrl);
          setReferenceStatus('ready');
        }
      } catch (err) {
        console.error('Gagal mengambil foto referensi siswa:', err);
        if (!cancelled) setReferenceStatus('error');
      }
    };

    fetchFotoSiswa();
    return () => {
      cancelled = true;
    };
  }, [namaSiswa]);

  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    const listSiswaKelas = siswaByKelas[newKelas] || [];
    if (listSiswaKelas.length > 0) {
      setNamaSiswa(listSiswaKelas[0]);
    } else {
      setNamaSiswa('');
    }
    setFotoSiswa(null);
    setFotoBukti(null);
    setDbFotoUrl(null);
    setReferenceStatus('loading');
    setFaceVerified(false);
    setVerificationMessage('');
  };

  const handleSiswaChange = (newSiswa: string) => {
    setNamaSiswa(newSiswa);
    setFotoSiswa(null);
    setFotoBukti(null);
    setDbFotoUrl(null);
    setReferenceStatus('loading');
    setFaceVerified(false);
    setVerificationMessage('');
  };

  // Kamera & Verifikasi Wajah
  const startCamera = async (mode: CameraMode = 'face') => {
    if (mode === 'face' && (!dbFotoUrl || referenceStatus !== 'ready')) {
      setVerificationMessage(referenceStatus === 'missing'
        ? 'Foto referensi siswa belum tersedia di database.'
        : 'Foto referensi siswa belum siap.');
      return;
    }

    const requestedFacingMode = mode === 'evidence' ? 'environment' : 'user';
    setCameraMode(mode);
    setFacingMode(requestedFacingMode);
    setCameraMessage('');
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: requestedFacingMode } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const actualFacingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
        if (actualFacingMode === 'user' || actualFacingMode === 'environment') {
          setFacingMode(actualFacingMode);
        }
      } else {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Elemen kamera belum siap. Silakan coba kembali.');
      }
    } catch (err) {
      console.error('Kamera tidak dapat diakses:', err);
      alert('Gagal mengaktifkan kamera. Pastikan Anda telah mengizinkan akses webcam.');
      setIsCameraOpen(false);
    }
  };

  const startEvidenceCamera = () => startCamera('evidence');

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsScanning(false);
  };

  const switchCamera = async () => {
    const video = videoRef.current;
    if (!video || isSwitchingCamera) return;

    setIsSwitchingCamera(true);
    const previousFacingMode = facingMode;
    const nextFacingMode = previousFacingMode === 'user' ? 'environment' : 'user';
    const previousStream = video.srcObject as MediaStream | null;
    previousStream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacingMode } },
      });
      video.srcObject = stream;
      await video.play();
      const actualFacingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
      setFacingMode(actualFacingMode === 'user' || actualFacingMode === 'environment'
        ? actualFacingMode
        : nextFacingMode);
      setCameraMessage('');
    } catch (err) {
      setCameraMessage(err instanceof Error ? `Tidak dapat mengganti kamera: ${err.message}` : 'Tidak dapat mengganti kamera.');
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: previousFacingMode } },
        });
        video.srcObject = fallbackStream;
        await video.play();
      } catch (fallbackError) {
        console.error('Kamera sebelumnya gagal dipulihkan:', fallbackError);
      }
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const handleScanAndVerify = async () => {
    setIsScanning(true);
    setVerificationMessage('Memeriksa wajah dan mencocokkan foto referensi...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !dbFotoUrl || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Kamera atau foto referensi belum siap.');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Gagal membaca gambar dari kamera.');

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFotoSiswa(canvas.toDataURL('image/jpeg', 0.9));

      const faceapi = await loadFaceApi();
      const cameraDescriptor = await getFaceDescriptor(faceapi, canvas);
      if (!cameraDescriptor) {
        setFaceVerified(false);
        setVerificationMessage('Wajah tidak terdeteksi. Posisikan satu wajah di tengah kamera dan coba lagi.');
        return;
      }

      let referenceDescriptor = faceDescriptorCache.get(dbFotoUrl);
      if (!referenceDescriptor) {
        const referenceImage = await loadReferenceImage(dbFotoUrl);
        referenceDescriptor = await getFaceDescriptor(faceapi, referenceImage) ?? undefined;
        if (!referenceDescriptor) {
          setFaceVerified(false);
          setVerificationMessage('Wajah tidak terdeteksi pada foto referensi database.');
          return;
        }
        faceDescriptorCache.set(dbFotoUrl, referenceDescriptor);
      }

      const distance = faceapi.euclideanDistance(cameraDescriptor, referenceDescriptor);
      const matched = distance <= 0.5;
      setFaceVerified(matched);
      setVerificationMessage(matched
        ? `Wajah cocok dengan data ${namaSiswa} (jarak ${distance.toFixed(2)}).`
        : `Wajah tidak cocok dengan data ${namaSiswa} (jarak ${distance.toFixed(2)}).`);
    } catch (err) {
      setFaceVerified(false);
      setVerificationMessage(err instanceof Error ? err.message : 'Verifikasi wajah gagal.');
    } finally {
      setIsScanning(false);
      stopCamera();
    }
  };

  const handleCaptureEvidence = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraMessage('Kamera belum siap. Silakan coba kembali.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraMessage('Gagal mengambil gambar dari kamera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFotoBukti(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
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
      console.error('Gagal mengambil data pelanggaran:', err);
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
    if (!faceVerified) {
      setStatusMsg({ type: 'error', message: 'Verifikasi wajah harus cocok dengan foto referensi siswa sebelum menyimpan.' });
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);

    const pencatatAktif = namaPetugas.trim() !== '' ? namaPetugas : 'Pengurus OSIS & MPK';
    let uploadedEvidencePath: string | null = null;

    try {
      let fotoBuktiPath: string | null = null;
      if (fotoBukti) {
        const evidenceBlob = await fetch(fotoBukti).then((response) => response.blob());
        const evidenceFileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        const evidenceStoragePath = `osis/${evidenceFileName}`;
        const { data: uploadedEvidence, error: uploadError } = await supabase.storage
          .from('bukti-pelanggaran')
          .upload(evidenceStoragePath, evidenceBlob, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw new Error(`Gagal mengunggah foto bukti: ${uploadError.message}`);
        uploadedEvidencePath = uploadedEvidence.path;
        fotoBuktiPath = uploadedEvidence.path;
      }

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
        foto_bukti_path: fotoBuktiPath,
      };

      const { error } = await supabase.from('pelanggaran_siswa').insert([payload]);
      if (error) {
        if (uploadedEvidencePath) {
          await supabase.storage.from('bukti-pelanggaran').remove([uploadedEvidencePath]);
        }
        throw error;
      }

      setStatusMsg({
        type: 'success',
        message: `Pelanggaran "${selectedPelanggaran}" (+${selectedPoin} Poin) atas nama ${namaSiswa} berhasil dicatat!`,
      });

      setKeterangan('');
      setFotoBukti(null);
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
        @keyframes scanAnimation {
          0% { top: 0%; }
          50% { top: 90%; }
          100% { top: 0%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #34d399;
          box-shadow: 0 0 15px #34d399, 0 0 25px #34d399;
          animation: scanAnimation 2s infinite ease-in-out;
        }
      ` }} />

      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
          
          {/* TOP BAR WITH LOGO MINDGUARD */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '14px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* SLOT LOGO APLIKASI */}
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#021f18', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <img 
                  src="/logo-mindguard.jpeg" 
                  alt="MindGuard Logo" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    // Fallback jika file gambar belum disimpan
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                  Panel Kedisiplinan OSIS & MPK (Pemeriksaan Gerbang)
                </h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>Pencatatan Kedisiplinan & Atribut Siswa di Gerbang Sekolah</span>
              </div>
            </div>

            <button onClick={() => { fetchPelanggaranSiswa(); }} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '9px 16px', borderRadius: '8px', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} color="#34d399" />
              <span>Refresh</span>
            </button>
          </div>

          {/* MAIN CONTENT */}
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
                  Form Input Pemeriksaan Gerbang
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* FOTO PROFIL SISWA & VERIFIKASI WAJAH */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div 
                        onClick={() => startCamera()}
                        title="Klik untuk Verifikasi Wajah"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '50%', 
                          backgroundColor: '#ffffff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: faceVerified ? '3px solid #34d399' : '3px solid rgba(52, 211, 153, 0.4)',
                          boxShadow: faceVerified ? '0 0 15px rgba(52, 211, 153, 0.5)' : 'none',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        {fotoSiswa || dbFotoUrl ? (
                          <img src={fotoSiswa || dbFotoUrl || ''} alt={fotoSiswa ? 'Hasil kamera siswa' : `Foto referensi ${namaSiswa}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={85} color="#021f18" style={{ marginTop: '12px' }} />
                        )}

                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: '#064e3b', borderRadius: '50%', padding: '6px', border: '1px solid #34d399' }}>
                          <Camera size={14} color="#34d399" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startCamera()}
                        disabled={referenceStatus !== 'ready'}
                        style={{
                          backgroundColor: 'rgba(52, 211, 153, 0.15)',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          color: '#a7f3d0',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: referenceStatus === 'ready' ? 'pointer' : 'not-allowed',
                          opacity: referenceStatus === 'ready' ? 1 : 0.6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ScanFace size={12} color="#34d399" />
                        <span>{faceVerified ? 'Verifikasi Ulang' : 'Verifikasi Wajah'}</span>
                      </button>
                      <span style={{ maxWidth: '160px', textAlign: 'center', fontSize: '11px', lineHeight: 1.4, color: faceVerified ? '#6ee7b7' : verificationMessage.includes('tidak cocok') || verificationMessage.includes('tidak terdeteksi') ? '#fca5a5' : '#a7f3d0' }}>
                        {verificationMessage || (referenceStatus === 'loading'
                          ? 'Memuat foto referensi...'
                          : referenceStatus === 'missing'
                            ? 'Foto referensi belum terdaftar.'
                            : referenceStatus === 'error'
                              ? 'Gagal memuat foto referensi.'
                              : 'Foto referensi siap diverifikasi.')}
                      </span>
                    </div>

                    {/* FIELD KELAS & SISWA */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                          Kelas & Jurusan
                        </label>
                        <select
                          value={kelas}
                          onChange={(e) => handleKelasChange(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                        >
                          {kelasOptions.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                          Nama Siswa Melanggar
                        </label>
                        <select
                          value={namaSiswa}
                          onChange={(e) => handleSiswaChange(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                        >
                          {(siswaByKelas[kelas] || []).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                          Jam Tiba / Kejadian
                        </label>
                        <input
                          type="text"
                          required
                          value={jamKejadian}
                          onChange={(e) => setJamKejadian(e.target.value)}
                          placeholder="Catat waktu kejadian"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                          Nama Petugas OSIS
                        </label>
                        <input
                          type="text"
                          required
                          value={namaPetugas}
                          onChange={(e) => setNamaPetugas(e.target.value)}
                          placeholder="Tulis nama petugas"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '12px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                        />
                      </div>

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
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', outline: 'none', backgroundColor: '#021f18', color: '#a7f3d0', fontWeight: '700' }}
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

                  {/* BANNER POIN */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(248, 113, 113, 0.4)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '700', display: 'block' }}>Kategori: {selectedKategori}</span>
                      <span style={{ fontSize: '12px', color: '#fee2e2', fontWeight: '700' }}>Poin yang Akan Ditambahkan:</span>
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
                      placeholder="Tulis keterangan di sini...."
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Foto Bukti Pelanggaran
                    </label>
                    {fotoBukti ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <img src={fotoBukti} alt="Preview foto bukti pelanggaran" style={{ width: '88px', height: '66px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.4)' }} />
                        <button
                          type="button"
                          title="Hapus foto bukti"
                          onClick={() => setFotoBukti(null)}
                          style={{ background: 'transparent', border: '1px solid rgba(248, 113, 113, 0.5)', color: '#fca5a5', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '11px' }}>Belum ada foto bukti.</p>
                    )}
                    <button
                      type="button"
                      onClick={startEvidenceCamera}
                      disabled={isSubmitting || isCameraOpen}
                      style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', color: '#a7f3d0', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: isSubmitting || isCameraOpen ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Camera size={14} />
                      {fotoBukti ? 'Ambil Ulang Foto' : 'Ambil Foto Bukti'}
                    </button>
                  </div>

                  {/* SANKSI */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Tindakan / Sanksi OSIS & MPK
                    </label>
                    <select
                      value={tindakan}
                      onChange={(e) => setTindakan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    >
                      <option value="Peringatan Lisan & Binaan OSIS">Peringatan Lisan & Binaan OSIS</option>
                      <option value="Penyitaan Atribut / Barang Pelanggaran">Penyitaan Atribut / Barang Pelanggaran</option>
                      <option value="Bersih-bersih Lingkungan Sekolah">Bersih-bersih Lingkungan Sekolah</option>
                      <option value="Diserahkan ke Guru Piket / BK">Diserahkan ke Guru Piket / BK</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !faceVerified}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: isSubmitting || !faceVerified ? 'not-allowed' : 'pointer',
                      opacity: faceVerified ? 1 : 0.65,
                      marginTop: '4px',
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isSubmitting ? 'Menyimpan...' : faceVerified ? 'Simpan Data Pelanggaran' : 'Verifikasi Wajah Terlebih Dahulu'}</span>
                  </button>
                </form>
              </div>

              {/* TABEL / REKAP PELANGGARAN SISWA */}
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '700' }}>
                      Rekap Pelanggaran Siswa
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#a7f3d0' }}>Total: {filteredData.length} Kasus</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama, kelas, jenis pelanggaran, atau petugas..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none' }}
                  />
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Memuat data...</p>
                ) : filteredData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '40px 0' }}>Belum ada pelanggaran yang dicatat.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
                    {filteredData.map((item) => (
                      <div key={item.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#021f18', borderLeft: '4px solid #34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{item.nama_siswa}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#064e3b', color: '#a7f3d0', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                              {item.kelas}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#451a03', color: '#f87171', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                              +{item.poin ?? 5} Poin
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fca5a5', marginTop: '6px' }}>
                          ⚠️ {item.jenis_pelanggaran}
                        </div>

                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          <strong>Waktu:</strong> {item.jam_kejadian} WIB ({item.tanggal})
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          <strong>Detail:</strong> {item.keterangan || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px', fontWeight: '700' }}>
                          Sanksi: {item.tindakan}
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', textAlign: 'right', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                          Petugas: <span style={{ color: '#34d399' }}>{item.pencatat || 'Pengurus OSIS & MPK'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* MODAL WEBCAM VERIFIKASI WAJAH */}
          {isCameraOpen && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ backgroundColor: '#021f18', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '16px', padding: '20px', maxWidth: '450px', width: '100%', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#ecfdf5', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cameraMode === 'face' ? <ScanFace size={18} color="#34d399" /> : <Camera size={18} color="#34d399" />}
                    {cameraMode === 'face' ? 'Verifikasi Wajah Siswa' : 'Foto Bukti Pelanggaran'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={switchCamera}
                      disabled={isSwitchingCamera}
                      title={`Ganti ke kamera ${facingMode === 'user' ? 'belakang' : 'depan'}`}
                      aria-label={`Ganti ke kamera ${facingMode === 'user' ? 'belakang' : 'depan'}`}
                      style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.35)', color: '#a7f3d0', borderRadius: '6px', padding: '6px', display: 'flex', cursor: isSwitchingCamera ? 'wait' : 'pointer', opacity: isSwitchingCamera ? 0.6 : 1 }}
                    >
                      <SwitchCamera size={17} />
                    </button>
                    <button onClick={stopCamera} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: '20px', border: '2px dashed rgba(52, 211, 153, 0.7)', borderRadius: '16px', pointerEvents: 'none' }} />
                  {isScanning && <div className="scan-line" />}
                </div>

                <p style={{ fontSize: '12px', color: '#a7f3d0', textAlign: 'center', margin: '12px 0' }}>
                  {cameraMode === 'evidence'
                    ? cameraMessage || 'Arahkan kamera ke bukti pelanggaran, lalu ambil foto.'
                    : isScanning ? 'Pindaian dan pencocokan wajah sedang berjalan...' : `Arahkan wajah ${namaSiswa || 'Siswa'} ke tengah kamera.`}
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={stopCamera}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#cbd5e1', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={cameraMode === 'evidence' ? handleCaptureEvidence : handleScanAndVerify}
                    disabled={isScanning}
                    style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: isScanning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {cameraMode === 'evidence' ? <Camera size={16} /> : <CheckCircle2 size={16} />}
                    <span>{isScanning ? 'Memproses...' : cameraMode === 'evidence' ? 'Ambil Foto Bukti' : 'Ambil Foto & Verifikasi'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            © 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>
        </div>
      </div>
    </>
  );
}