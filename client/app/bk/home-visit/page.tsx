'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Home, Plus, Calendar, MapPin, RefreshCw, ClipboardList } from 'lucide-react';

export default function HomeVisitPage() {
  const router = useRouter();
  const [dataHomeVisit, setDataHomeVisit] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }
    fetchHomeVisit();
  }, [router]);

  const fetchHomeVisit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('home_visit')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setDataHomeVisit(data);
    } catch (err) {
      console.error('Gagal memuat data home visit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpanJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa || !kelas || !alamat) {
      alert('Mohon isi nama siswa, kelas, dan alamat tujuan!');
      return;
    }

    try {
      const { error } = await supabase.from('home_visit').insert([
        { nama_siswa: namaSiswa, kelas, alamat, tanggal, catatan: catatan || 'Kunjungan rutin pendampingan BK' }
      ]);

      if (error) throw error;
      alert('✅ Jadwal Home Visit berhasil ditambahkan ke database!');
      setShowModal(false);
      setNamaSiswa('');
      setKelas('');
      setAlamat('');
      setCatatan('');
      fetchHomeVisit();
    } catch (err: any) {
      alert('Gagal menyimpan ke database: ' + err.message);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `body, html { background-color: #021f18 !important; margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }` }} />
      {/* DIPERBAIKI: Menggunakan width 100% agar simetris dan seimbang di tengah */}
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #021f18 0%, #032c22 35%, #054233 70%, #064e3b 100%)', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
        <div style={{ background: '#021f18', borderRight: '1px solid rgba(52, 211, 153, 0.15)', flexShrink: 0 }}>
          <Sidebar />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* TOP BAR */}
          <div style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#ffffff', padding: '18px 30px', borderBottom: '1px solid rgba(52, 211, 153, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: 8, borderRadius: 10, border: '1px solid rgba(52,211,153,0.3)' }}>
                <Home size={24} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Pendataan Home Visit (Kunjungan Rumah)</h2>
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>SMK Budi Bakti Ciwidey[cite: 7] • Sinkronisasi Database Real-time</span>
              </div>
            </div>
            <button onClick={fetchHomeVisit} style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '9px 16px', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} color="#34d399" /> {isLoading ? 'Memuat...' : 'Perbarui Data'}
            </button>
          </div>

          {/* KONTEN UTAMA - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* INFO & TOMBOL AKSI */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.92)', backdropFilter: 'blur(16px)', borderRadius: '18px', padding: '26px 30px', marginBottom: '28px', border: '1.5px solid rgba(52, 211, 153, 0.35)', boxShadow: '0 10px 35px rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#ecfdf5', fontSize: '16.5px', fontWeight: '800' }}>Modul Koordinasi Kunjungan Rumah</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12.5px' }}>Pencatatan resmi pendampingan intensif bersama orang tua / wali siswa berdasarkan database server[cite: 7].</p>
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}>
                <Plus size={16} /> Tambah Jadwal Home Visit Baru
              </button>
            </div>

            {/* GRID DATA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              {dataHomeVisit.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(2,31,24,0.6)', borderRadius: '16px', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <ClipboardList size={38} color="#34d399" style={{ marginBottom: '10px', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Belum ada data jadwal home visit yang tersimpan di database[cite: 7].</p>
                </div>
              ) : (
                dataHomeVisit.map((item) => (
                  <div key={item.id} style={{ backgroundColor: 'rgba(2, 31, 24, 0.88)', padding: '22px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.25)', borderLeft: '4px solid #34d399', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '15.5px', fontWeight: '800' }}>{item.nama_siswa}</strong>
                      <span style={{ backgroundColor: '#064e3b', color: '#a7f3d0', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', border: '1px solid rgba(52,211,153,0.3)' }}>{item.kelas}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="#f87171" /> <strong>Alamat:</strong> {item.alamat}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} color="#38bdf8" /> <strong>Tanggal:</strong> {item.tanggal}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', backgroundColor: '#011611', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      📝 <strong>Catatan BK:</strong> <em>{item.catatan}</em>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MODAL INPUT */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: '#021f18', padding: '30px', borderRadius: '18px', maxWidth: '460px', width: '100%', border: '1.5px solid rgba(52, 211, 153, 0.4)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>Tambah Jadwal Home Visit Baru</h3>
                <form onSubmit={handleSimpanJadwal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Nama Siswa</label>
                    <input type="text" required value={namaSiswa} onChange={(e) => setNamaSiswa(e.target.value)} placeholder="Contoh: Ahmad Fauzi" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Kelas & Jurusan</label>
                    <input type="text" required value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: XII RPL 1" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Alamat Tujuan Kunjungan</label>
                    <input type="text" required value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Kampung / Jalan / RT RW..." style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Tanggal Pelaksanaan</label>
                    <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Catatan / Keperluan Kunjungan</label>
                    <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Alasan atau tujuan khusus..." style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Batal</button>
                    <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.4)' }}>Simpan ke Database[cite: 7]</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey[cite: 7]
          </footer>
        </div>
      </div>
    </>
  );
}