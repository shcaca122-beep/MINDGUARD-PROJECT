'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function BKPage() {
  const router = useRouter();
  const [dataCurhat, setDataCurhat] = useState<any[]>([]);
  const [dataKonseling, setDataKonseling] = useState<any[]>([]);
  const [dataPelanggaran, setDataPelanggaran] = useState<any[]>([]);
  const [dataMasterPelanggaran, setDataMasterPelanggaran] = useState<any[]>([]);
  const [tabAktif, setTabAktif] = useState<'curhat' | 'konseling'>('curhat');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 1. Cek Hak Akses (Hanya Guru BK & Admin)
  useEffect(() => {
    const sessionData = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    
    if (!sessionData) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(sessionData);
      const userRole = (parsed.role || '').toLowerCase();

      // Jika BUKAN Guru BK atau Admin, lemparkan kembali ke Dashboard Siswa
      if (!userRole.includes('bk') && !userRole.includes('admin')) {
        alert('🚫 Akses Ditolak! Halaman ini khusus untuk Guru Bimbingan Konseling (BK).');
        router.push('/dashboard');
        return;
      }

      setIsAuthorized(true);
      fetchDataBK();
    } catch (err) {
      console.error('Error memverifikasi sesi:', err);
      router.push('/');
    }
  }, [router]);

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

      const { data: masterPelanggaran, error: masterError } = await supabase
        .from('master_pelanggaran')
        .select('*')
        .order('poin', { ascending: false });

      if (curhat) setDataCurhat(curhat);
      if (konseling) setDataKonseling(konseling);

      if (!pelanggaranError) {
        setDataPelanggaran(pelanggaranData || []);
      } else {
        console.warn('Gagal mengambil data pelanggaran siswa:', pelanggaranError.message);
        setDataPelanggaran([]);
      }

      if (!masterError) {
        setDataMasterPelanggaran(masterPelanggaran || []);
      } else {
        console.warn('Gagal mengambil data master pelanggaran:', masterError.message);
        setDataMasterPelanggaran([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data BK:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handlePelanggaranUpdate = () => {
      fetchDataBK();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pelanggaran-updated', handlePelanggaranUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pelanggaran-updated', handlePelanggaranUpdate);
      }
    };
  }, []);

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#d1f2d9', fontWeight: 'bold', color: '#1b3b2b' }}>
        ⌛ Memeriksa Hak Akses...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', backgroundColor: '#d1f2d9' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR BK */}
        <div style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '16px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>🧠 Panel Guru Bimbingan Konseling (BK)</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a7f3d0' }}>Sistem Manajemen Konseling & Curhat Siswa</p>
          </div>
          <button
            onClick={fetchDataBK}
            style={{ backgroundColor: '#2d523e', border: '1px solid #a7f3d0', color: '#ffffff', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLoading ? '⌛ Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>

        {/* KONTEN UTAMA BK */}
        <div style={{ padding: '30px 20px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #2563eb', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>PESAN CURHAT</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '4px' }}>{dataCurhat.length} Pesan</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #059669', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>JADWAL KONSELING</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', marginTop: '4px' }}>{dataKonseling.length} Sesi</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #dc2626', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>PELANGGARAN MASUK</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginTop: '4px' }}>{dataPelanggaran.length} Catatan</div>
            </div>
          </div>

          {/* TAB INTERNAL */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setTabAktif('curhat')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: tabAktif === 'curhat' ? '#1b3b2b' : '#ffffff', color: tabAktif === 'curhat' ? '#ffffff' : '#1b3b2b', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📩 Pesan Curhat Siswa
            </button>
            <button
              onClick={() => setTabAktif('konseling')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: tabAktif === 'konseling' ? '#1b3b2b' : '#ffffff', color: tabAktif === 'konseling' ? '#ffffff' : '#1b3b2b', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📅 Permohonan Konseling
            </button>
          </div>

          <div style={{ marginTop: '20px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1b3b2b' }}>� Pelanggaran Masuk dari OSIS</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>Catatan pelanggaran yang baru diinput oleh OSIS akan tampil di sini</p>
              </div>
              <Link href="/bk/pelanggaran" style={{ textDecoration: 'none', color: '#1b3b2b', fontWeight: 'bold', fontSize: '12px' }}>
                Lihat Semua →
              </Link>
            </div>

            {dataPelanggaran.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Belum ada pelanggaran yang masuk dari OSIS.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {dataPelanggaran.slice(0, 5).map((item) => (
                  <div key={item.id || `${item.nama_siswa}-${item.created_at}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#1f2937', fontSize: '13px' }}>{item.nama_siswa || 'Siswa'}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.kelas || '-'} • {item.jenis_pelanggaran || item.jenis || 'Pelanggaran'}</div>
                      </div>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>Poin {item.poin ?? 0}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      {item.tanggal || new Date(item.created_at).toLocaleDateString('id-ID')} • {item.pencatat || 'OSIS'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABEL DATA */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', marginTop: '20px' }}>
            {tabAktif === 'curhat' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#ffffff' }}>
                    <th style={{ padding: '12px' }}>Pengirim / Kelas</th>
                    <th style={{ padding: '12px' }}>Judul Pesan</th>
                    <th style={{ padding: '12px' }}>Tanggal</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataCurhat.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada curhatan masuk.</td></tr>
                  ) : (
                    dataCurhat.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>🔒 {item.nama_siswa || 'Anonim'}</td>
                        <td style={{ padding: '12px' }}>{item.judul_pesan || item.topik}</td>
                        <td style={{ padding: '12px' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status || 'TERKIRIM'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#ffffff' }}>
                    <th style={{ padding: '12px' }}>Siswa</th>
                    <th style={{ padding: '12px' }}>Jadwal</th>
                    <th style={{ padding: '12px' }}>Topik</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataKonseling.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Belum ada permohonan konseling.</td></tr>
                  ) : (
                    dataKonseling.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama_siswa} ({item.kelas})</td>
                        <td style={{ padding: '12px' }}>{item.tanggal}</td>
                        <td style={{ padding: '12px' }}>{item.topik}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status || 'TERJADWAL'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}