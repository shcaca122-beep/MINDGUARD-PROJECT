'use client';

import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

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

      // Object data default
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

      // Coba simpan ke Supabase
      let { error } = await supabase.from('layanan_siswa').insert([payload]);

      // Jika ada error karena salah satu kolom tidak ada, hapus kolom bermasalah dan coba lagi
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#d1f2d9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📩</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1b3b2b' }}>
            Layanan Curhat Anonim
          </h2>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '30px 40px', flex: 1 }}>
          
          <div
            style={{
              backgroundColor: '#1b3b2b',
              color: '#ffffff',
              padding: '20px 24px',
              borderRadius: '12px',
              marginBottom: '25px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>📩 Ruang Curhat Safe Space</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#a7f3d0' }}>
              Luapkan apa yang kamu rasakan tanpa perlu khawatir. Kamu bisa memilih untuk mengirim pesan secara Anonim (Tanpa Nama).
            </p>
          </div>

          {/* ALERT NOTIFIKASI */}
          {status && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13.5px',
                fontWeight: 'bold',
                backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: status.type === 'success' ? '#15803d' : '#991b1b',
                border: `1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`,
              }}
            >
              {status.type === 'success' ? '✅ ' : '⚠️ '} {status.message}
            </div>
          )}

          {/* FORM GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px', alignItems: 'start' }}>
            
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#1b3b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Tulis Curhatanmu
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Kategori Cerita
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                  >
                    <option value="Pribadi / Emosional">Pribadi / Kecemasan / Emosional</option>
                    <option value="Masalah Teman / Bullying">Masalah Peretemanan / Bullying</option>
                    <option value="Kendala Keluarga">Masalah Keluarga / Rumah</option>
                    <option value="Kesulitan Belajar">Kesulitan Belajar / Akademik</option>
                    <option value="Lainnya">Lain-Lain</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Judul / Perihal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Merasa tertekan dengan tugas / Konflik sama teman"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', marginBottom: '6px' }}>
                    Isi Cerita / Curhatan
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Tuliskan semua yang ingin kamu luapkan secara bebas di sini..."
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold', color: '#1b3b2b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isAnonim}
                      onChange={(e) => setIsAnonim(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🔒 Kirim sebagai Anonim (Sembunyikan Namaku)
                  </label>
                  <p style={{ margin: '4px 0 0 26px', fontSize: '11px', color: '#64748b' }}>
                    {isAnonim ? 'Identitasmu tidak akan terlihat oleh Guru BK.' : 'Nama dan kelasmu akan terlihat oleh Guru BK.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#1b3b2b',
                    color: '#ffffff',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {isLoading ? '⌛ Mengirim Rahasia...' : '📩 Kirim Curhatan Sekarang'}
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🔒</span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', color: '#1b3b2b' }}>Ruang Aman (Safe Space)</h4>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                  MindGuard dirancang khusus agar kamu bisa meluapkan isi hati tanpa rasa takut dihakimi. Curhatanmu akan dibaca secara cermat oleh Guru BK.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '22px' }}>💡</span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', color: '#1b3b2b' }}>Tips Menulis Curhatan</h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#475569', lineHeight: '1.7' }}>
                  <li>Tuliskan apa adanya yang sedang kamu rasakan.</li>
                  <li>Sebutkan situasi yang membuatmu merasa tidak nyaman.</li>
                  <li>Jika butuh bantuan tatap muka, gunakan fitur <strong>Booking BK</strong>.</li>
                </ul>
              </div>
            </div>

          </div>

        </div>

        <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '12px', textAlign: 'center', fontSize: '11px' }}>
          &copy; 2026 Ruang Tenang MindGuard - SMK Budi Bakti Ciwidey
        </footer>

      </div>
    </div>
  );
}