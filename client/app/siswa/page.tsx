'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/lib/swal';


// MASTER DAFTAR KELAS RESMI SMK BUDI BAKTI CIWIDEY
const DAFTAR_KELAS = [
  // KELAS X
  'X BRP 1', 'X BRP 2', 'X BRP 3', 'X BRP 4', 'X BRP 5', 'X BRP 6',
  'X RPL 1', 'X RPL 2', 'X RPL 3', 'X RPL 4',
  'X DKV 1', 'X DKV 2',

  // KELAS XI
  'XI BRP 1', 'XI BRP 2', 'XI BRP 3', 'XI BRP 4', 'XI BRP 5', 'XI BRP 6',
  'XI RPL 1', 'XI RPL 2', 'XI RPL 3', 'XI RPL 4',
  'XI DKV 1', 'XI DKV 2',

  // KELAS XII
  'XII BRP 1', 'XII BRP 2', 'XII BRP 3', 'XII BRP 4', 'XII BRP 5', 'XII BRP 6',
  'XII RPL 1', 'XII RPL 2', 'XII RPL 3', 'XII RPL 4',
  'XII DKV 1', 'XII DKV 2', 'XII DKV 3', 'XII DKV 4',
];

export default function PortalSiswa() {
  const [tab, setTab] = useState<'curhat' | 'izin' | 'konseling' | 'kelompok'>('curhat');
  const [loading, setLoading] = useState(false);

  // 1. STATE FORM CURHAT ANONIM
  const [formCurhat, setFormCurhat] = useState({
    judul: '',
    isi: '',
    jenis: 'Guru BK',
  });

  // 2. STATE FORM IZIN / SAKIT
  const [formIzin, setFormIzin] = useState({
    nama: '',
    kelas: DAFTAR_KELAS[0],
    jenis: 'Sakit',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  // 3. STATE FORM DAFTAR KONSELING INDIVIDUAL
  const [formKonseling, setFormKonseling] = useState({
    nama: '',
    kelas: DAFTAR_KELAS[0],
    topik: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // 4. STATE FORM BIMBINGAN KELOMPOK
  const [formKelompok, setFormKelompok] = useState({
    kelas: DAFTAR_KELAS[0],
    topik: '',
    anggota: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // ==========================================
  // HANDLER 1: SUBMIT CURHAT ANONIM
  // ==========================================
  const handleKirimCurhat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCurhat.judul || !formCurhat.isi) {
      showError('Data Belum Lengkap', 'Judul dan isi curhatan wajib diisi!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('curhat_anonim').insert([
      {
        judul: formCurhat.judul,
        isi: formCurhat.isi,
        jenis: formCurhat.jenis,
        status: 'Perlu Respon',
        balasan: '',
        tanggal: new Date().toISOString().split('T')[0],
      },
    ]);

    setLoading(false);

    if (error) {
      showError('Gagal Mengirim', error.message);
    } else {
      showSuccess('Curhatan Terkirim!', 'Curhat anonim kamu berhasil terkirim secara rahasia ke Guru BK.');
      setFormCurhat({ judul: '', isi: '', jenis: 'Guru BK' });
    }
  };

  // ==========================================
  // HANDLER 2: SUBMIT SURAT IZIN / SAKIT
  // ==========================================
  const handleKirimIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIzin.nama || !formIzin.keterangan) {
      showError('Data Belum Lengkap', 'Nama dan keterangan izin wajib diisi!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('perizinan').insert([
      {
        nama: formIzin.nama,
        kelas: formIzin.kelas,
        jenis: formIzin.jenis,
        tanggal: formIzin.tanggal,
        keterangan: formIzin.keterangan,
      },
    ]);

    setLoading(false);

    if (error) {
      showError('Gagal Mengirim', error.message);
    } else {
      showSuccess('Pengajuan Berhasil!', 'Surat Izin/Sakit kamu telah tercatat di sistem Guru BK.');
      setFormIzin({
        nama: '',
        kelas: DAFTAR_KELAS[0],
        jenis: 'Sakit',
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
      });
    }
  };

  // ==========================================
  // HANDLER 3: SUBMIT DAFTAR KONSELING INDIVIDUAL
  // ==========================================
  const handleKirimKonseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKonseling.nama || !formKonseling.topik) {
      showError('Data Belum Lengkap', 'Nama dan topik bahasan wajib diisi!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('konseling_individual').insert([
      {
        nama: formKonseling.nama,
        kelas: formKonseling.kelas,
        topik: formKonseling.topik,
        status: 'TERJADWAL',
        tanggal: formKonseling.tanggal,
      },
    ]);

    setLoading(false);

    if (error) {
      showError('Gagal Pendaftaran', error.message);
    } else {
      showSuccess('Janji Temu Terbuat!', 'Permohonan konseling individual telah masuk ke jadwal Guru BK.');
      setFormKonseling({
        nama: '',
        kelas: DAFTAR_KELAS[0],
        topik: '',
        tanggal: new Date().toISOString().split('T')[0],
      });
    }
  };

  // ==========================================
  // HANDLER 4: SUBMIT BIMBINGAN KELOMPOK
  // ==========================================
  const handleKirimKelompok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKelompok.topik || !formKelompok.anggota) {
      showError('Data Belum Lengkap', 'Topik dan daftar nama anggota wajib diisi!');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('bimbingan_kelompok').insert([
      {
        kelas: formKelompok.kelas,
        topik: formKelompok.topik,
        anggota: formKelompok.anggota,
        status: 'MENUNGGU',
        tanggal: formKelompok.tanggal,
      },
    ]);

    setLoading(false);

    if (error) {
      showError('Gagal Pengajuan', error.message);
    } else {
      showSuccess('Pengajuan Berhasil!', 'Pengajuan Bimbingan Kelompok telah dikirim ke Guru BK.');
      setFormKelompok({
        kelas: DAFTAR_KELAS[0],
        topik: '',
        anggota: '',
        tanggal: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#e2efda', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px', color: '#1f2937' }}>
      <div style={{ maxWidth: '650px', margin: '20px auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', border: '1px solid #b5d8b6' }}>
        
        {/* HEADER PORTAL SISWA */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '40px' }}>🏫</span>
          <h2 style={{ margin: '8px 0 4px 0', color: '#1b3b2b', fontSize: '22px' }}>Portal Layanan Siswa BK</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>SMK Budi Bakti Ciwidey • MindGuard System</p>
        </div>

        {/* TAB MENU FORM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '24px', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '14px' }}>
          <button
            onClick={() => setTab('curhat')}
            style={{ padding: '10px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'curhat' ? '#1b3b2b' : 'transparent', color: tab === 'curhat' ? '#ffffff' : '#4b5563', transition: '0.2s' }}
          >
            💬 Curhat
          </button>
          <button
            onClick={() => setTab('izin')}
            style={{ padding: '10px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'izin' ? '#1b3b2b' : 'transparent', color: tab === 'izin' ? '#ffffff' : '#4b5563', transition: '0.2s' }}
          >
            🏥 Izin/Sakit
          </button>
          <button
            onClick={() => setTab('konseling')}
            style={{ padding: '10px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'konseling' ? '#1b3b2b' : 'transparent', color: tab === 'konseling' ? '#ffffff' : '#4b5563', transition: '0.2s' }}
          >
            👤 Konseling
          </button>
          <button
            onClick={() => setTab('kelompok')}
            style={{ padding: '10px 4px', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tab === 'kelompok' ? '#1b3b2b' : 'transparent', color: tab === 'kelompok' ? '#ffffff' : '#4b5563', transition: '0.2s' }}
          >
            👥 Kelompok
          </button>
        </div>

        {/* FORM 1: CURHAT ANONIM */}
        {tab === 'curhat' && (
          <form onSubmit={handleKirimCurhat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Judul Curhatan:</label>
              <input
                required
                type="text"
                placeholder="Misal: Cemas Menghadapi Ujian / Masalah Pertemanan"
                value={formCurhat.judul}
                onChange={(e) => setFormCurhat({ ...formCurhat, judul: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tujuan Layanan Konseling:</label>
              <select
                value={formCurhat.jenis}
                onChange={(e) => setFormCurhat({ ...formCurhat, jenis: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              >
                <option value="Guru BK">Guru BK / Konselor Sekolah</option>
                <option value="Peer Konseling">Peer Konseling (Konselor Teman Sebaya)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Isi Curhatan (Rahasia & Anonim):</label>
              <textarea
                required
                rows={5}
                placeholder="Ceritakan apa yang kamu rasakan secara terbuka di sini..."
                value={formCurhat.isi}
                onChange={(e) => setFormCurhat({ ...formCurhat, isi: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? 'Mengirim...' : '🚀 Kirim Curhatan (Anonim)'}
            </button>
          </form>
        )}

        {/* FORM 2: SURAT IZIN / SAKIT */}
        {tab === 'izin' && (
          <form onSubmit={handleKirimIzin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Pilih Kelas:</label>
              <select
                value={formIzin.kelas}
                onChange={(e) => setFormIzin({ ...formIzin, kelas: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontWeight: 'bold' }}
              >
                {DAFTAR_KELAS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Nama Lengkap Siswa:</label>
              <input
                required
                type="text"
                placeholder="Nama sesuai presensi kelas"
                value={formIzin.nama}
                onChange={(e) => setFormIzin({ ...formIzin, nama: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Jenis Ketidakhadiran:</label>
              <select
                value={formIzin.jenis}
                onChange={(e) => setFormIzin({ ...formIzin, jenis: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tanggal Tidak Hadir:</label>
              <input
                required
                type="date"
                value={formIzin.tanggal}
                onChange={(e) => setFormIzin({ ...formIzin, tanggal: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Keterangan / Alasan Detail:</label>
              <textarea
                required
                rows={3}
                placeholder="Tuliskan alasan tidak dapat hadir di sekolah..."
                value={formIzin.keterangan}
                onChange={(e) => setFormIzin({ ...formIzin, keterangan: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? 'Mengirim...' : '📩 Kirim Surat Izin / Sakit'}
            </button>
          </form>
        )}

        {/* FORM 3: DAFTAR KONSELING INDIVIDUAL */}
        {tab === 'konseling' && (
          <form onSubmit={handleKirimKonseling} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Pilih Kelas:</label>
              <select
                value={formKonseling.kelas}
                onChange={(e) => setFormKonseling({ ...formKonseling, kelas: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontWeight: 'bold' }}
              >
                {DAFTAR_KELAS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Nama Lengkap Siswa:</label>
              <input
                required
                type="text"
                placeholder="Nama lengkap kamu"
                value={formKonseling.nama}
                onChange={(e) => setFormKonseling({ ...formKonseling, nama: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Rencana Tanggal Konseling:</label>
              <input
                required
                type="date"
                value={formKonseling.tanggal}
                onChange={(e) => setFormKonseling({ ...formKonseling, tanggal: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Topik Bahasan / Masalah:</label>
              <textarea
                required
                rows={3}
                placeholder="Topik atau hal yang ingin kamu konselingkan bersama Guru BK..."
                value={formKonseling.topik}
                onChange={(e) => setFormKonseling({ ...formKonseling, topik: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? 'Mengirim...' : '🗓️ Buat Janji Konseling'}
            </button>
          </form>
        )}

        {/* FORM 4: BIMBINGAN KELOMPOK */}
        {tab === 'kelompok' && (
          <form onSubmit={handleKirimKelompok} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Pilih Kelas:</label>
              <select
                value={formKelompok.kelas}
                onChange={(e) => setFormKelompok({ ...formKelompok, kelas: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontWeight: 'bold' }}
              >
                {DAFTAR_KELAS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Topik Bimbingan Kelompok:</label>
              <input
                required
                type="text"
                placeholder="Misal: Diskusi Persiapan PKL / Kerjasama Tim"
                value={formKelompok.topik}
                onChange={(e) => setFormKelompok({ ...formKelompok, topik: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Daftar Nama Anggota Kelompok:</label>
              <textarea
                required
                rows={3}
                placeholder="Tuliskan nama-nama anggota kelompok kamu..."
                value={formKelompok.anggota}
                onChange={(e) => setFormKelompok({ ...formKelompok, anggota: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Rencana Tanggal Pelaksanaan:</label>
              <input
                required
                type="date"
                value={formKelompok.tanggal}
                onChange={(e) => setFormKelompok({ ...formKelompok, tanggal: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}
            >
              {loading ? 'Mengirim...' : '👥 Ajukan Bimbingan Kelompok'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}