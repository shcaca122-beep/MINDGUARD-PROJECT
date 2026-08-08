'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { MessageSquareHeart, ShieldCheck, PenTool, Send, Lock, Lightbulb } from 'lucide-react';

export default function CurhatPage() {
  const [kategori, setKategori] = useState('Pribadi / Emosional');
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [isAnonim, setIsAnonim] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const sessionData = localStorage.getItem('user_session');
      const session = sessionData ? JSON.parse(sessionData) : {};

      const namaPengirim = isAnonim ? 'Anonim' : (session.nama || session.email || 'Siswa');

      const payload: any = {
        nama_siswa: namaPengirim,
        layanan: 'CURHAT',
        judul_pesan: `[${kategori}] ${judul}`,
        deskripsi: pesan,
        topik: pesan,
        status: 'TERKIRIM',
      };

      if (session.kelas) {
        payload.kelas = session.kelas;
      }

      let { error } = await supabase.from('layanan_siswa').insert([payload]);

      if (error && error.message?.includes('topik')) {
        delete payload.topik;
        const retry = await supabase.from('layanan_siswa').insert([payload]);
        error = retry.error;
      }

      if (error && error.message?.includes('deskripsi')) {
        delete payload.deskripsi;
        payload.judul_pesan = `[${kategori}] ${judul}: ${pesan}`;
        const retry2 = await supabase.from('layanan_siswa').insert([payload]);
        error = retry2.error;
      }

      if (error) {
        throw new Error(error.message);
      }

      setStatus({
        type: 'success',
        message: 'Curhatanmu berhasil terkirim secara aman & rahasia ke Guru BK!',
      });
      setJudul('');
      setPesan('');
    } catch (err: any) {
      console.error('Error submit:', err);
      setStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim curhatan.',
      });
    } finally {
      setIsLoading(false);
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
          
          {/* TOP BAR GRADASI */}
          <div style={{ 
            background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', 
            color: '#ffffff', 
            padding: '18px 30px', 
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <MessageSquareHeart size={22} color="#34d399" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Layanan Curhat Anonim
            </h2>
          </div>

          {/* CONTENT - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            <div
              style={{
                backgroundColor: 'rgba(2, 31, 24, 0.85)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '25px',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ecfdf5' }}>Ruang Curhat Safe Space</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0' }}>
                Luapkan apa yang kamu rasakan tanpa perlu khawatir. Kamu bisa memilih untuk mengirim pesan secara Anonim (Tanpa Nama).
              </p>
            </div>

            {status && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  backgroundColor: status.type === 'success' ? '#064e3b' : '#7f1d1d',
                  color: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${status.type === 'success' ? '#10b981' : '#f87171'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {status.type === 'success' ? '✅ ' : '⚠️ '} {status.message}
              </div>
            )}

            {/* FORM GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '25px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
              
              <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#ecfdf5', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PenTool size={18} color="#34d399" />
                  Tulis Curhatanmu
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Kategori Cerita
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', backgroundColor: '#021f18', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="Pribadi / Emosional">Pribadi / Kecemasan / Emosional</option>
                      <option value="Masalah Teman / Bullying">Masalah Peretemanan / Bullying</option>
                      <option value="Kendala Keluarga">Masalah Keluarga / Rumah</option>
                      <option value="Kesulitan Belajar">Kesulitan Belajar / Akademik</option>
                      <option value="Lainnya">Lain-Lain</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Judul / Perihal
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Merasa tertekan dengan tugas / Konflik sama teman"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      Isi Cerita / Curhatan
                    </label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Tuliskan semua yang ingin kamu luapkan secara bebas di sini..."
                      value={pesan}
                      onChange={(e) => setPesan(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none', backgroundColor: '#021f18', color: '#fff' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#021f18', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: '700', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAnonim}
                        onChange={(e) => setIsAnonim(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <Lock size={14} color="#34d399" />
                      Kirim sebagai Anonim (Sembunyikan Namaku)
                    </label>
                    <p style={{ margin: '4px 0 0 26px', fontSize: '11px', color: '#94a3b8' }}>
                      {isAnonim ? 'Identitasmu tidak akan terlihat oleh Guru BK.' : 'Nama dan kelasmu akan terlihat oleh Guru BK.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
                      color: '#ffffff',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Send size={15} color="#a7f3d0" />
                    <span>{isLoading ? 'Mengirim Rahasia...' : 'Kirim Curhatan Sekarang'}</span>
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Lock size={18} color="#fcd34d" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Ruang Aman (Safe Space)</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    MindGuard dirancang khusus agar kamu bisa meluapkan isi hati tanpa rasa takut dihakimi. Curhatanmu akan dibaca secara cermat oleh Guru BK.
                  </p>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.85)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Lightbulb size={18} color="#fcd34d" />
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: '#ffffff', fontWeight: '700' }}>Tips Menulis Curhatan</h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
                    <li>Tuliskan apa adanya yang sedang kamu rasakan.</li>
                    <li>Sebutkan situasi yang membuatmu merasa tidak nyaman.</li>
                    <li>Jika butuh bantuan tatap muka, gunakan fitur <strong>Booking BK</strong>.</li>
                  </ul>
                </div>
              </div>

            </div>

          </div>

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
          </footer>

        </div>
      </div>
    </>
  );
}