'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { 
  MessageSquareText, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Tag, 
  Inbox, 
  Sparkles
} from 'lucide-react';

export default function CurhatBKPage() {
  const [curhatList, setCurhatList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurhat = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('layanan_siswa')
        .select('*')
        .eq('layanan', 'CURHAT')
        .order('created_at', { ascending: false });
      
      if (data) setCurhatList(data);
    } catch (err) {
      console.error('Gagal mengambil data curhat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurhat();
  }, []);

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
                <MessageSquareText size={22} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Pesan Curhat Masuk Siswa
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#a7f3d0', fontWeight: '500' }}>
                  Ruang aman & rahasia konsultasi siswa bersama Guru BK
                </p>
              </div>
            </div>

            <button
              onClick={fetchCurhat}
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
                    Total {curhatList.length} Pesan Diterima
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#a7f3d0' }}>
                    Identitas siswa dijaga kerahasiaannya untuk privasi bimbingan
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
                Kerahasiaan Terjamin
              </span>
            </div>

            {/* DAFTAR CARD PESAN CURHAT */}
            {curhatList.length === 0 ? (
              <div style={{
                backgroundColor: 'rgba(2, 31, 24, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ background: '#021f18', padding: '14px', borderRadius: '50%', color: '#94a3b8', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <Inbox size={32} />
                  </div>
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>Belum Ada Pesan Masuk</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Pesan curhatan anonim yang dikirimkan oleh siswa akan otomatis tampil di sini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                {curhatList.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      backgroundColor: 'rgba(2, 31, 24, 0.85)', 
                      backdropFilter: 'blur(12px)',
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      borderLeft: '5px solid #34d399',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#064e3b', padding: '6px', borderRadius: '8px', color: '#34d399', display: 'flex', alignItems: 'center', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          <ShieldCheck size={16} />
                        </div>
                        <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '14px' }}>
                          {item.nama_siswa || 'Anonim'}
                        </span>
                        {item.kelas && (
                          <span style={{ fontSize: '11px', color: '#a7f3d0', backgroundColor: '#064e3b', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                            {item.kelas}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8' }}>
                        <Clock size={13} />
                        <span>{new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Topik Permasalahan */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#064e3b', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#a7f3d0', marginBottom: '10px' }}>
                      <Tag size={13} color="#34d399" />
                      <span>Topik: {item.judul_pesan || item.topik}</span>
                    </div>

                    {/* Isi Pesan */}
                    <div style={{ backgroundColor: '#021f18', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {item.deskripsi || item.topik}
                      </p>
                    </div>

                    {/* Footer Status Badge */}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        backgroundColor: 'rgba(217, 119, 6, 0.2)',
                        color: '#fcd34d',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '10px',
                        letterSpacing: '0.04em',
                        border: '1px solid rgba(252, 211, 77, 0.3)'
                      }}>
                        {item.status || 'TERKIRIM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}