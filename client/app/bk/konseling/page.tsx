'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  RefreshCw, 
  User, 
  Calendar, 
  Tag, 
  CheckCircle, 
  CheckCheck, 
  Inbox, 
  Sparkles
} from 'lucide-react';

export default function KonselingBKPage() {
  const [konselingList, setKonselingList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKonseling = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'KONSELING')
        .order('created_at', { ascending: false });
      
      if (data) setKonselingList(data);
    } catch (err) {
      console.error('Gagal mengambil data konseling:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKonseling();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await supabase.from('layanan_siswa').update({ status }).eq('id', id);
      fetchKonseling();
    } catch (err) {
      console.error('Gagal memperbarui status konseling:', err);
    }
  };

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
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR HEADER */}
          <div style={{
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)',
            color: '#ffffff',
            padding: '18px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(52, 211, 153, 0.15)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarCheck size={22} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Jadwal Konseling Individual
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>
                  Manajemen sesi tatap muka dan bimbingan personal siswa
                </p>
              </div>
            </div>

            <button
              onClick={fetchKonseling}
              disabled={isLoading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#ffffff',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} color="#34d399" />
              <span>{isLoading ? 'Memperbarui...' : 'Refresh Data'}</span>
            </button>
          </div>

          {/* KONTEN UTAMA - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', maxWidth: '1400px', width: '100%', margin: '0 auto', flex: 1, boxSizing: 'border-box' }}>
            
            {/* BANNER INFORMASI RINGKAS */}
            <div style={{
              backgroundColor: 'rgba(2, 31, 24, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '25px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flexWrap: 'wrap',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '10px', borderRadius: '10px', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#ecfdf5' }}>
                    Total {konselingList.length} Sesi Permohonan Konseling[cite: 6]
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#a7f3d0' }}>
                    Setujui atau ubah status sesi jika perjumpaan konseling telah selesai[cite: 6]
                  </div>
                </div>
              </div>

              <span style={{
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                color: '#34d399',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                Manajemen Sesi BK[cite: 6]
              </span>
            </div>

            {/* TABEL DATA KONSELING ELEGAN */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
              
              {/* Table Header Strip */}
              <div style={{
                background: '#011611',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#a7f3d0',
                borderBottom: '1px solid rgba(52, 211, 153, 0.2)'
              }}>
                <CalendarCheck size={16} color="#34d399" />
                <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.02em' }}>
                  Daftar Permohonan & Jadwal Konseling Siswa
                </span>
              </div>

              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: '#f8fafc', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#021f18', color: '#94a3b8', borderBottom: '1px solid rgba(52, 211, 153, 0.15)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Siswa</th>
                      <th style={{ padding: '14px 20px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jadwal / Sesi</th>
                      <th style={{ padding: '14px 20px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topik Masalah</th>
                      <th style={{ padding: '14px 20px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Aksi BK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {konselingList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <Inbox size={28} />
                          </div>
                          <span>Belum ada permohonan konseling individual dari siswa.[cite: 6]</span>
                        </td>
                      </tr>
                    ) : (
                      konselingList.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.15s ease' }}>
                          
                          {/* Nama Siswa */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <User size={16} color="#34d399" />
                              <div>
                                <span style={{ fontWeight: '700', color: '#f8fafc' }}>{item.nama_siswa}</span>
                                <span style={{ fontSize: '11px', color: '#a7f3d0', marginLeft: '8px', background: '#064e3b', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                  {item.kelas || '-'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Jadwal / Sesi */}
                          <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '12.5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={13} color="#94a3b8" />
                              <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{item.tanggal || 'Menyesuaikan'}</span>
                            </div>
                          </td>

                          {/* Topik Masalah */}
                          <td style={{ padding: '16px 20px', color: '#e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Tag size={13} color="#34d399" />
                              <span>{item.judul_pesan || item.topik || 'Konseling Umum'}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <span style={{
                              backgroundColor: item.status === 'DISETUJUI' 
                                ? 'rgba(5, 150, 105, 0.2)' 
                                : item.status === 'SELESAI' 
                                ? 'rgba(37, 99, 235, 0.2)'
                                : 'rgba(217, 119, 6, 0.2)',
                              color: item.status === 'DISETUJUI' 
                                ? '#34d399' 
                                : item.status === 'SELESAI' 
                                ? '#60a5fa'
                                : '#fcd34d',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontWeight: '700',
                              fontSize: '11px',
                              letterSpacing: '0.03em',
                              border: item.status === 'DISETUJUI' ? '1px solid rgba(52, 211, 153, 0.3)' : item.status === 'SELESAI' ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(252, 211, 77, 0.3)'
                            }}>
                              {item.status || 'MENUNGGU ACC'}
                            </span>
                          </td>

                          {/* Aksi Tombol */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button 
                                onClick={() => updateStatus(item.id, 'DISETUJUI')} 
                                style={{ 
                                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                                  color: '#ffffff', 
                                  border: 'none', 
                                  padding: '6px 12px', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  fontWeight: '700',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <CheckCircle size={13} />
                                <span>Setujui</span>
                              </button>

                              <button 
                                onClick={() => updateStatus(item.id, 'SELESAI')} 
                                style={{ 
                                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                                  color: '#ffffff', 
                                  border: 'none', 
                                  padding: '6px 12px', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  fontWeight: '700',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <CheckCheck size={13} />
                                <span>Selesai</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey[cite: 6]
          </footer>

        </div>
      </div>
    </>
  );
}