'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, RefreshCw, MessageSquare, Calendar, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

export default function BKPage() {
  const router = useRouter();
  const [dataCurhat, setDataCurhat] = useState<any[]>([]);
  const [dataKonseling, setDataKonseling] = useState<any[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<any[]>([]);
  const [tabAktif, setTabAktif] = useState<'curhat' | 'konseling'>('curhat');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // State untuk Input Nama Guru BK Manual & Notifikasi Modern (Default "Umum")
  const [namaGuruBK, setNamaGuruBK] = useState('Umum');
  const [inputNama, setInputNama] = useState('Umum');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Cek Hak Akses & Load Nama Tersimpan
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    
    if (!sessionData) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(sessionData);
      const userRole = (parsed.role || '').toLowerCase();

      if (!userRole.includes('bk') && !userRole.includes('admin')) {
        setStatusMsg({ type: 'error', message: '🚫 Akses Ditolak! Halaman ini khusus untuk Guru Bimbingan Konseling (BK).' });
        router.push('/dashboard');
        return;
      }

      setIsAuthorized(true);

      const savedName = localStorage.getItem('bk_custom_name');
      if (savedName) {
        setNamaGuruBK(savedName);
        setInputNama(savedName);
      } else if (parsed.nama) {
        setNamaGuruBK(parsed.nama);
        setInputNama(parsed.nama);
      }

      fetchDataBK();
    } catch (err) {
      console.error('Error memverifikasi sesi:', err);
      router.push('/');
    }
  }, [router]);

  const handleSimpanNamaManual = () => {
    if (!inputNama.trim()) {
      setStatusMsg({ type: 'error', message: 'Nama Guru BK tidak boleh kosong!' });
      return;
    }

    setNamaGuruBK(inputNama);
    localStorage.setItem('bk_custom_name', inputNama);

    ['user_session', 'admin_session'].forEach((key) => {
      const sess = localStorage.getItem(key);
      if (sess) {
        try {
          const parsed = JSON.parse(sess);
          parsed.nama = inputNama;
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch (e) {}
      } else {
        localStorage.setItem(key, JSON.stringify({ nama: inputNama, role: 'BK' }));
      }
    });

    setStatusMsg({ type: 'success', message: 'Nama Guru BK berhasil disimpan!' });
    
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const fetchDataBK = async () => {
    setIsLoading(true);
    try {
      const { data: curhat } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'CURHAT')
        .order('created_at', { ascending: false });

      const { data: konseling } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'KONSELING')
        .order('created_at', { ascending: false });

      const { data: pelanggaranData, error: pelanggaranError } = await supabase
        .from('pelanggaran_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (curhat) setDataCurhat(curhat);
      if (konseling) setDataKonseling(konseling);
      if (!pelanggaranError) {
        setDataPelanggaran(pelanggaranData || []);
      } else {
        setDataPelanggaran([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data BK:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#021f18', fontWeight: 'bold', color: '#34d399', fontFamily: 'system-ui' }}>
        ⌛ Memeriksa Hak Akses...
      </div>
    );
  }

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
      {/* STRUKTUR UTAMA: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR BK */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#34d399" />
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Panel Guru Bimbingan Konseling (BK)
                </h2>
                <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '500' }}>Aktif Sebagai: <strong style={{ color: '#ffffff' }}>{namaGuruBK}</strong></span>
              </div>
            </div>
            <button
              onClick={fetchDataBK}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '9px 16px', borderRadius: '8px', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} color="#34d399" />
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>

          {/* KONTEN UTAMA BK - SIMETRIS DI TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* NOTIFIKASI MODERN BANNER */}
            {statusMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', fontSize: '13.5px', backgroundColor: statusMsg.type === 'success' ? '#064e3b' : '#7f1d1d', color: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : '#f87171'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <span>{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{statusMsg.message}</span>
              </div>
            )}

            {/* KOTAK INPUT NAMA GURU BK MANUAL */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '22px 24px', marginBottom: '25px', border: '1.5px solid rgba(52, 211, 153, 0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <UserCheck size={22} color="#34d399" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '15px', color: '#ecfdf5', fontWeight: '700' }}>Pengaturan Nama Guru BK Aktif</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Ketik nama dan gelar lengkap Anda di bawah ini agar langsung tampil di sistem.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  placeholder="Contoh: Umum"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.4)', backgroundColor: '#021f18', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleSimpanNamaManual}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#ffffff', border: 'none', padding: '11px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', boxSizing: 'border-box' }}
                >
                  Simpan Nama
                </button>
              </div>
            </div>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #38bdf8', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>PESAN CURHAT</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#e0f2fe', marginTop: '4px' }}>{dataCurhat.length} Pesan</div>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #34d399', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>JADWAL KONSELING</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#ecfdf5', marginTop: '4px' }}>{dataKonseling.length} Sesi</div>
              </div>
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #f87171', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>PELANGGARAN MASUK</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fee2e2', marginTop: '4px' }}>{dataPelanggaran.length} Catatan</div>
              </div>
            </div>

            {/* PELANGGARAN MASUK DARI OSIS */}
            <div style={{ marginBottom: '25px', backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#f87171" />
                    Pelanggaran Masuk dari OSIS
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Catatan pelanggaran terbaru yang diinput oleh pengurus OSIS di gerbang</p>
                </div>
                <Link href="/bk/pelanggaran" style={{ textDecoration: 'none', color: '#34d399', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Lihat Semua</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {dataPelanggaran.length === 0 ? (
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Belum ada pelanggaran yang masuk dari OSIS.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {dataPelanggaran.slice(0, 5).map((item) => (
                    <div key={item.id || `${item.nama_siswa}-${item.created_at}`} style={{ border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '12px', padding: '14px', backgroundColor: '#021f18', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{item.nama_siswa || 'Siswa'}</strong>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.kelas || '-'} • <span style={{ color: '#fca5a5' }}>{item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</span></div>
                        </div>
                        <span style={{ backgroundColor: '#451a03', color: '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(248, 113, 113, 0.3)' }}>+{item.poin ?? 0} Poin</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        📅 {item.tanggal || new Date(item.created_at).toLocaleDateString('id-ID')} • Petugas: {item.pencatat || 'OSIS'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TAB INTERNAL */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={() => setTabAktif('curhat')}
                style={{ 
                  flex: 1,
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  backgroundColor: tabAktif === 'curhat' ? '#059669' : 'rgba(2, 31, 24, 0.85)', 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  border: tabAktif === 'curhat' ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)' 
                }}
              >
                📩 Pesan Curhat Siswa
              </button>
              <button
                onClick={() => setTabAktif('konseling')}
                style={{ 
                  flex: 1,
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  backgroundColor: tabAktif === 'konseling' ? '#059669' : 'rgba(2, 31, 24, 0.85)', 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  border: tabAktif === 'konseling' ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.2)' 
                }}
              >
                📅 Permohonan Konseling
              </button>
            </div>

            {/* TABEL DATA */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              {tabAktif === 'curhat' ? (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#f8fafc', minWidth: '450px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#011611', color: '#a7f3d0', borderBottom: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <th style={{ padding: '14px' }}>Pengirim / Kelas</th>
                        <th style={{ padding: '14px' }}>Judul Pesan</th>
                        <th style={{ padding: '14px' }}>Tanggal</th>
                        <th style={{ padding: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataCurhat.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada curhatan masuk.</td></tr>
                      ) : (
                        dataCurhat.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '14px', fontWeight: '700' }}>🔒 {item.nama_siswa || 'Anonim'}</td>
                            <td style={{ padding: '14px' }}>{item.judul_pesan || item.topik}</td>
                            <td style={{ padding: '14px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#fcd34d', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid rgba(252, 211, 77, 0.3)' }}>{item.status || 'TERKIRIM'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#f8fafc', minWidth: '450px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#011611', color: '#a7f3d0', borderBottom: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <th style={{ padding: '14px' }}>Siswa</th>
                        <th style={{ padding: '14px' }}>Jadwal</th>
                        <th style={{ padding: '14px' }}>Topik</th>
                        <th style={{ padding: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataKonseling.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada permohonan konseling.</td></tr>
                      ) : (
                        dataKonseling.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '14px', fontWeight: '700' }}>{item.nama_siswa} ({item.kelas})</td>
                            <td style={{ padding: '14px', color: '#94a3b8' }}>{item.tanggal}</td>
                            <td style={{ padding: '14px' }}>{item.topik}</td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ backgroundColor: 'rgba(5, 150, 105, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>{item.status || 'TERJADWAL'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}