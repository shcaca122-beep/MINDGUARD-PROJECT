'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { FileText, Printer, Search, RefreshCw, X } from 'lucide-react';

export default function IzinSakitBKPage() {
  const router = useRouter();
  const [dataIzin, setDataIzin] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterWaktu, setFilterWaktu] = useState<'semua' | 'mingguan' | 'bulanan'>('semua');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<string>('perizinan_siswa');
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }
    fetchDataIzin();

    const channel = supabase
      .channel('realtime_perizinan_all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchDataIzin();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const fetchDataIzin = async () => {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('perizinan_siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const res = await supabase
          .from('izin_siswa')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (res.data) {
          setDataIzin(res.data);
          setActiveTable('izin_siswa');
        }
      } else {
        setDataIzin(data);
        setActiveTable('perizinan_siswa');
      }
    } catch (err) {
      console.error('Gagal mengambil data perizinan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, statusBaru: string) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .update({ status: statusBaru })
        .eq('id', id);

      if (error) throw error;
      fetchDataIzin();
    } catch (err: any) {
      alert('Gagal memperbarui status ke database: ' + err.message);
    }
  };

  const filteredData = dataIzin.filter((item) => {
    const matchText = 
      item.nama_siswa?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.jenis_izin?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(filterText.toLowerCase());

    if (!matchText) return false;

    if (filterWaktu === 'semua') return true;

    const itemDate = new Date(item.created_at || item.tanggal_mulai || item.tanggal);
    const now = new Date();

    if (filterWaktu === 'mingguan') {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (filterWaktu === 'bulanan') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

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
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
        
        {/* SIDEBAR */}
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }} className="no-print">
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR */}
          <div className="no-print" style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.25)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: '9px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)', flexShrink: 0 }}>
                <FileText size={24} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Panel Rekap Perizinan & Sakit Siswa</h2>
                <span style={{ fontSize: '11.5px', color: '#a7f3d0' }}>SMK Budi Bakti Ciwidey • Sinkronisasi Database Real-time</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={fetchDataIzin} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 16px', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} color="#34d399" /> {isLoading ? 'Memuat...' : 'Refresh'}
              </button>
              <button onClick={() => setShowPrintModal(true)} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(5,150,105,0.4)' }}>
                <Printer size={15} /> Cetak / Simpan PDF
              </button>
            </div>
          </div>

          {/* KONTEN UTAMA - DIATUR SIMETRIS DI TENGAH */}
          <div className="no-print" style={{ padding: '30px', flex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* FILTER PENCARIAN & WAKTU */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama siswa, kelas, atau jenis izin..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.35)', backgroundColor: 'rgba(2, 31, 24, 0.88)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['semua', 'mingguan', 'bulanan'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setFilterWaktu(w)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      backgroundColor: filterWaktu === w ? '#059669' : 'rgba(2, 31, 24, 0.85)',
                      color: '#fff',
                      border: filterWaktu === w ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.25)',
                      textTransform: 'capitalize',
                      boxShadow: filterWaktu === w ? '0 4px 12px rgba(5,150,105,0.3)' : 'none'
                    }}
                  >
                    {w === 'semua' ? 'Semua Waktu' : `Rekap ${w}`}
                  </button>
                ))}
              </div>
            </div>

            {/* DAFTAR PERIZINAN */}
            {isLoading ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Memuat data perizinan dari database...</p>
            ) : filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(2,31,24,0.6)', borderRadius: '16px', border: '1px solid rgba(52,211,153,0.2)' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Tidak ada data perizinan atau sakit siswa yang ditemukan.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                {filteredData.map((item) => {
                  const statusCurr = (item.status || '').toUpperCase();
                  const sudahDiputuskan = statusCurr.includes('DISETUJUI') || statusCurr.includes('DITOLAK');

                  return (
                    <div key={item.id} style={{ backgroundColor: 'rgba(2, 31, 24, 0.88)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.25)', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>{item.nama_siswa}</strong>
                          <span style={{ backgroundColor: '#064e3b', color: '#a7f3d0', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', border: '1px solid rgba(52,211,153,0.3)' }}>{item.kelas}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#fca5a5', fontWeight: '700', marginBottom: '8px' }}>
                          📌 [{item.jenis_izin || item.kategori || 'Perizinan'}]
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                          📅 <strong>Waktu:</strong> {item.tanggal_mulai || item.tanggal || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '14px', backgroundColor: '#011611', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          💬 <strong>Alasan:</strong> {item.alasan || '-'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                          Status: {item.status || 'MENUNGGU'}
                        </span>

                        {sudahDiputuskan ? (
                          <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 'bold', backgroundColor: 'rgba(5,150,105,0.2)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)' }}>
                            🔒 Terkunci ({item.status})
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateStatus(item.id, 'DISETUJUI BK')} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
                              Setujui
                            </button>
                            <button onClick={() => handleUpdateStatus(item.id, 'DITOLAK BK')} style={{ backgroundColor: '#b91c1c', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(185,28,28,0.3)' }}>
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MODAL PRATINJAU CETAK PDF */}
          {showPrintModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '15px', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: '#ffffff', color: '#000000', width: '100%', maxWidth: '850px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                
                <div className="no-print" style={{ backgroundColor: '#021f18', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Pratinjau Dokumen Rekap PDF</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.print()} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Printer size={14} /> Cetak / Simpan PDF
                    </button>
                    <button onClick={() => setShowPrintModal(false)} style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div id="print-area" style={{ padding: '30px', overflowY: 'auto', backgroundColor: '#fff', fontFamily: 'Times New Roman, serif' }}>
                  <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '20px' }}>
                    <img 
                      src="/logo-smk.png" 
                      alt="Logo SMK" 
                      style={{ width: '75px', height: '75px', objectFit: 'contain', margin: '0 auto 6px auto', display: 'block' }} 
                      onError={(e: any) => { e.target.style.display = 'none'; }} 
                    />
                    <h3 style={{ margin: '2px 0', fontSize: '13px', letterSpacing: '0.5px' }}>YAYASAN PENDIDIKAN BUDI BAKTI</h3>
                    <h2 style={{ margin: '3px 0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>SMK BUDI BAKTI CIWIDEY</h2>
                    <p style={{ margin: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>REKAPITULASI PERIZINAN DAN SAKIT SISWA</p>
                    <p style={{ margin: '2px 0', fontSize: '10px', color: '#333' }}>Periode: {filterWaktu.toUpperCase()} | Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '30px' }}>No</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Nama Siswa</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '70px' }}>Kelas</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Jenis / Kategori</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '80px' }}>Tanggal</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Alasan / Keterangan</th>
                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '90px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ border: '1px solid #000', padding: '15px', textAlign: 'center' }}>Tidak ada data rekap perizinan.</td>
                        </tr>
                      ) : (
                        filteredData.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #000', padding: '6px' }}><b>{item.nama_siswa}</b></td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{item.kelas}</td>
                            <td style={{ border: '1px solid #000', padding: '6px' }}>{item.jenis_izin || item.kategori || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{item.tanggal_mulai || item.tanggal || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '6px' }}>{item.alasan || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}><b>{item.status || 'MENUNGGU'}</b></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11.5px' }}>
                    <div></div>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <p style={{ margin: 0 }}>Ciwidey, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p style={{ margin: '2px 0 50px 0' }}>Guru Bimbingan Konseling,</p>
                      <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Tim BK SMK Budi Bakti</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          <footer className="no-print" style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}