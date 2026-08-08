'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { PhoneCall, Plus, Printer, ClipboardList } from 'lucide-react';

export default function PanggilanOrtuPage() {
  const router = useRouter();
  const [dataPanggilan, setDataPanggilan] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [kelas, setKelas] = useState('');
  const [keperluan, setKeperluan] = useState('Konsultasi Pelanggaran & Pembinaan Siswa');
  const [tanggalPanggilan, setTanggalPanggilan] = useState(new Date().toISOString().split('T')[0]);
  const [pukul, setPukul] = useState('09:00');

  useEffect(() => {
    const session = localStorage.getItem('user_session') || localStorage.getItem('admin_session');
    if (!session) {
      router.push('/');
      return;
    }
    fetchPanggilan();
  }, [router]);

  const fetchPanggilan = async () => {
    try {
      const { data, error } = await supabase
        .from('panggilan_ortu')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setDataPanggilan(data);
    } catch (err) {
      console.error('Gagal mengambil data panggilan:', err);
    }
  };

  const handleSimpanPanggilan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa || !kelas) {
      alert('Mohon isi nama siswa dan kelas!');
      return;
    }

    try {
      const { error } = await supabase.from('panggilan_ortu').insert([
        { nama_siswa: namaSiswa, kelas, keperluan, tanggal: tanggalPanggilan, pukul }
      ]);

      if (error) throw error;
      alert('✅ Surat panggilan orang tua berhasil dibuat dan disimpan ke database!');
      setShowModal(false);
      setNamaSiswa('');
      setKelas('');
      fetchPanggilan();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  // Cetak PDF Surat Panggilan Resmi Berkop & Logo SMK Budi Bakti Ciwidey
  const handleCetakPDF = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Surat Panggilan Orang Tua - ${item.nama_siswa}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
            .kop { display: flex; align-items: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 25px; }
            .logo { width: 75px; height: 75px; object-fit: contain; margin-right: 20px; }
            .instansi { text-align: center; width: 100%; }
            .instansi h2, .instansi h3, .instansi p { margin: 2px 0; }
            .content { margin-top: 20px; }
            .ttd-container { display: flex; justify-content: space-between; margin-top: 50px; }
            .ttd { text-align: center; width: 220px; }
            .btn-print { background: #047857; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF Resmi</button>
          
          <div class="kop">
            <img src="/logo-smk.png" class="logo" alt="Logo SMK Budi Bakti" onerror="this.style.display='none'" />
            <div class="instansi">
              <h3 style="font-size: 14px;">YAYASAN PENDIDIKAN BUDI BAKTI</h3>
              <h2 style="font-size: 18px;">SMK BUDI BAKTI CIWIDEY</h2>
              <p style="font-size: 12px;">Terakreditasi A | Program Keahlian: TKR, TBSM, TKJ, RPL</p>
              <p style="font-size: 10.5px;">Jl. Babakan Tiga No. 99 Ciwidey - Kabupaten Bandung 40973</p>
            </div>
          </div>

          <div style="text-align: right; margin-bottom: 20px;">
            Ciwidey, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <div class="content">
            <p>Nomor : 421.5 / ${item.id} / BK-SMKBB / 2026</p>
            <p>Lampiran : -</p>
            <p>Perihal : <strong>Undangan Orang Tua / Wali Siswa</strong></p>
            <br/>
            <p>Kepada Yth.<br/><strong>Bapak/Ibu Orang Tua / Wali Siswa dari:</strong><br/>
            Nama Siswa: <strong>${item.nama_siswa} (${item.kelas})</strong><br/>
            Di Tempat</p>
            <br/>
            <p><em>Assalamu'alaikum Wr. Wb.</em></p>
            <p>Puji syukur kita panjatkan ke hadirat Allah SWT. Semoga Bapak/Ibu senantiasa dalam lindungan-Nya. Sehubungan dengan perkembangan pembinaan kedisiplinan dan prestasi akademik siswa di sekolah, kami mengundang Bapak/Ibu untuk hadir ke sekolah guna melakukan koordinasi dan konsultasi bersama Guru Bimbingan Konseling (BK).</p>
            
            <p>Pertemuan tersebut akan dilaksanakan pada:</p>
            <table style="margin-left: 30px; margin-bottom: 15px;">
              <tr><td><strong>Hari / Tanggal</strong></td><td>: ${item.tanggal}</td></tr>
              <tr><td><strong>Pukul</strong></td><td>: ${item.pukul} WIB s.d Selesai</td></tr>
              <tr><td><strong>Tempat</strong></td><td>: Ruang Bimbingan Konseling (BK) SMK Budi Bakti Ciwidey</td></tr>
              <tr><td><strong>Keperluan</strong></td><td>: ${item.keperluan}</td></tr>
            </table>

            <p>Mengingat pentingnya acara ini demi kebaikan dan masa depan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran tepat pada waktunya.</p>
            <p>Demikian undangan resmi ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
            <p><em>Wassalamu'alaikum Wr. Wb.</em></p>
          </div>

          <div class="ttd-container">
            <div></div>
            <div class="ttd">
              <p>Mengetahui,<br/>Guru Bimbingan Konseling,</p>
              <br/><br/><br/>
              <p><strong>( Tim BK SMK Budi Bakti )</strong></p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                <PhoneCall size={24} color="#34d399" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Surat & Log Panggilan Orang Tua</h2>
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>SMK Budi Bakti Ciwidey[cite: 8] • Sinkronisasi Database Real-time</span>
              </div>
            </div>
          </div>

          {/* KONTEN UTAMA - DISIMETRISKAN KE TENGAH */}
          <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* INFO & TOMBOL AKSI */}
            <div style={{ backgroundColor: 'rgba(2, 31, 24, 0.92)', backdropFilter: 'blur(16px)', borderRadius: '18px', padding: '26px 30px', marginBottom: '28px', border: '1.5px solid rgba(52, 211, 153, 0.35)', boxShadow: '0 10px 35px rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#ecfdf5', fontSize: '16.5px', fontWeight: '800' }}>Penerbitan Surat Resmi Orang Tua / Wali Siswa</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12.5px' }}>Buat dan cetak surat undangan resmi lengkap dengan kop institusi dan logo sekolah[cite: 8].</p>
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)' }}>
                <Plus size={16} /> Buat Surat Panggilan Ortu
              </button>
            </div>

            {/* GRID DATA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              {dataPanggilan.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'rgba(2,31,24,0.6)', borderRadius: '16px', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <ClipboardList size={38} color="#34d399" style={{ marginBottom: '10px', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Belum ada surat panggilan orang tua yang diterbitkan[cite: 8].</p>
                </div>
              ) : (
                dataPanggilan.map((item) => (
                  <div key={item.id} style={{ backgroundColor: 'rgba(2, 31, 24, 0.88)', padding: '22px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.25)', borderLeft: '4px solid #f87171', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '15.5px', fontWeight: '800' }}>{item.nama_siswa}</strong>
                      <span style={{ backgroundColor: '#451a03', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', border: '1px solid rgba(248,113,113,0.3)' }}>{item.kelas}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '8px' }}>
                      📋 <strong>Keperluan:</strong> {item.keperluan}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#38bdf8', marginBottom: '16px' }}>
                      📅 <strong>Jadwal:</strong> {item.tanggal} Pukul {item.pukul} WIB
                    </div>
                    <button onClick={() => handleCetakPDF(item)} style={{ width: '100%', backgroundColor: '#064e3b', color: '#a7f3d0', border: '1px solid rgba(52,211,153,0.3)', padding: '11px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxSizing: 'border-box' }}>
                      <Printer size={16} /> Cetak Surat PDF Resmi
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MODAL INPUT */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: '#021f18', padding: '30px', borderRadius: '18px', maxWidth: '460px', width: '100%', border: '1.5px solid rgba(52, 211, 153, 0.4)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box' }}>
                <h3 style={{ color: '#ffffff', margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800' }}>Buat Surat Panggilan Orang Tua</h3>
                <form onSubmit={handleSimpanPanggilan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Nama Siswa</label>
                    <input type="text" required value={namaSiswa} onChange={(e) => setNamaSiswa(e.target.value)} placeholder="Contoh: Budi Santoso" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Kelas</label>
                    <input type="text" required value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: XI TKR 2" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Keperluan / Alasan Pemanggilan</label>
                    <input type="text" required value={keperluan} onChange={(e) => setKeperluan(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Tanggal</label>
                      <input type="date" required value={tanggalPanggilan} onChange={(e) => setTanggalPanggilan(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700', display: 'block', marginBottom: '5px' }}>Pukul</label>
                      <input type="text" required value={pukul} onChange={(e) => setPukul(e.target.value)} placeholder="09:00" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: '#064e3b', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(52,211,153,0.3)', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Batal</button>
                    <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.4)' }}>Simpan & Buat Surat</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer style={{ background: 'linear-gradient(135deg, #021f18 0%, #064e3b 100%)', color: '#a7f3d0', padding: '16px', textAlign: 'center', fontSize: '11.5px', borderTop: '1px solid rgba(52, 211, 153, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            &copy; 2026 Panel Bimbingan Konseling MindGuard - SMK Budi Bakti Ciwidey[cite: 8]
          </footer>
        </div>
      </div>
    </>
  );
}