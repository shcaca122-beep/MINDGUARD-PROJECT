'use client';
import { useState } from 'react';

export default function AdminDashboardPage() {
  // Role Aktif: 'BK' atau 'PIKET'
  const [role, setRole] = useState<'BK' | 'PIKET'>('BK');

  // =========================================================================
  // STATE & DATA DASHBOARD GURU BK
  // =========================================================================
  const [tabBK, setTabBK] = useState<'curhat' | 'konseling_ind' | 'home_visit' | 'panggilan_ortu'>('curhat');

  // Data Curhat Anonim
  const [dataCurhat, setDataCurhat] = useState([
    { id: '1', judul: 'Lelah dengan Tekanan Ujian', isi: 'Saya merasa sangat tertekan dengan jadwal ujian pekan depan, takut tidak bisa memenuhi ekspektasi orang tua.', tanggal: '01 Agust 2026', jenis: 'Peer Konseling', status: 'Perlu Respon', balasan: '' },
    { id: '2', judul: 'Konflik Teman Sebangku', isi: 'Sudah 3 hari saya tidak saling sapa dengan teman sebangku karena salah paham tugas kelompok.', tanggal: '31 Juli 2026', jenis: 'Guru BK', status: 'Selesai', balasan: 'Tetap tenang ya, coba komunikasikan baik-baik saat jam istirahat.' },
  ]);

  // Data Konseling Individual
  const [dataKonselingInd, setDataKonselingInd] = useState([
    { id: '1', nama: 'Ahmad (X RPL 1)', tanggal: '02 Agust 2026', topik: 'Kesulitan Belajar & Motivasi', status: 'TERJADWAL' },
    { id: '2', nama: 'Siti (XII AK 2)', tanggal: '28 Juli 2026', topik: 'Kecemasan Ujian Sekolah', status: 'SELESAI' },
  ]);

  // Data Home Visit
  const [dataHomeVisit, setDataHomeVisit] = useState([
    { id: '1', nama: 'Budi (XI TKJ 2)', alamat: 'Jl. Raya Ciwidey No. 45', tanggal: '06 Agust 2026', alasan: 'Absen 4 Hari Tanpa Keterangan', status: 'Rencana Visit' },
  ]);

  // Data Panggilan Ortu
  const [dataPanggilanOrtu, setDataPanggilanOrtu] = useState([
    { id: '1', nama: 'Deni (XII TBM 1)', ortu: 'Bpk. Herman', tanggal: '07 Agust 2026', alasan: 'Kedisiplinan Berulang', status: 'Surat Terkirim' },
  ]);

  // Modal Control State BK
  const [modalCurhatDetail, setModalCurhatDetail] = useState<any>(null);
  const [textBalasan, setTextBalasan] = useState('');
  
  const [showModalAddKonseling, setShowModalAddKonseling] = useState(false);
  const [formKonseling, setFormKonseling] = useState({ nama: '', tanggal: '', topik: '' });

  const [showModalAddHomeVisit, setShowModalAddHomeVisit] = useState(false);
  const [formHomeVisit, setFormHomeVisit] = useState({ nama: '', alamat: '', tanggal: '', alasan: '' });

  const [showModalAddOrtu, setShowModalAddOrtu] = useState(false);
  const [formOrtu, setFormOrtu] = useState({ nama: '', ortu: '', tanggal: '', alasan: '' });

  const [previewSurat, setPreviewSurat] = useState<{ judul: string; detail: string } | null>(null);

  // --- HANDLERS BK ---
  const handleBalasCurhat = () => {
    if (!textBalasan.trim()) return;
    setDataCurhat(dataCurhat.map(item => item.id === modalCurhatDetail.id ? { ...item, status: 'Selesai', balasan: textBalasan } : item));
    setModalCurhatDetail(null);
    setTextBalasan('');
  };

  const handleSimpanKonseling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKonseling.nama) return;
    setDataKonselingInd([...dataKonselingInd, { id: Date.now().toString(), ...formKonseling, status: 'TERJADWAL' }]);
    setShowModalAddKonseling(false);
    setFormKonseling({ nama: '', tanggal: '', topik: '' });
  };

  const handleToggleStatusKonseling = (id: string) => {
    setDataKonselingInd(dataKonselingInd.map(item => item.id === id ? { ...item, status: item.status === 'TERJADWAL' ? 'SELESAI' : 'TERJADWAL' } : item));
  };

  const handleSimpanHomeVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHomeVisit.nama) return;
    setDataHomeVisit([...dataHomeVisit, { id: Date.now().toString(), ...formHomeVisit, status: 'Rencana Visit' }]);
    setShowModalAddHomeVisit(false);
    setFormHomeVisit({ nama: '', alamat: '', tanggal: '', alasan: '' });
  };

  const handleSimpanPanggilanOrtu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrtu.nama) return;
    setDataPanggilanOrtu([...dataPanggilanOrtu, { id: Date.now().toString(), ...formOrtu, status: 'Surat Terkirim' }]);
    setShowModalAddOrtu(false);
    setFormOrtu({ nama: '', ortu: '', tanggal: '', alasan: '' });
  };

  // =========================================================================
  // STATE DASHBOARD GURU PIKET
  // =========================================================================
  const [tabPiket, setTabPiket] = useState<'terlambat' | 'izin_keluar' | 'uks' | 'jurnal'>('terlambat');
  
  const [dataTerlambat, setDataTerlambat] = useState([
    { id: '1', nama: 'gesuy', kelas: 'XII RPL 1', jam: '07:15 WIB', alasan: 'Ban Sepeda Motor Bocor', tindakLanjut: 'Beri Surat Masuk Kelas', status: 'Diberi Izin' },
    { id: '2', nama: 'Silvuy', kelas: 'XII RPL 2', jam: '07:25 WIB', alasan: 'Ketinggalan Angkot', tindakLanjut: 'Peringatan Lisan', status: 'Diberi Izin' },
  ]);

  const [dataIzinKeluar, setDataIzinKeluar] = useState([
    { id: '1', nama: 'Andi Wijaya', kelas: 'XI TKJ 2', jamKeluar: '09:30', jamKembali: '10:15', alasan: 'Ambil Buku Paket Ketinggalan', status: 'MENUNGGU' },
  ]);

  const [dataUKS] = useState([
    { id: '1', nama: 'Budi Santoso', kelas: 'X TKJ 1', keluhan: 'Pusing & Demam', penanganan: 'Istirahat & Minum Obat', status: 'Di UKS' },
  ]);

  const handleApproveIzin = (id: string) => {
    setDataIzinKeluar(dataIzinKeluar.map(item => item.id === id ? { ...item, status: 'DISETUJUI' } : item));
  };

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937', margin: 0, padding: 0 }}>
      
      {/* 🧭 NAVBAR UTAMA */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>MindGuard</div>
            <div style={{ fontSize: '11px', color: '#a7f3d0' }}>Sistem Informasi BK & Kedisiplinan Piket</div>
          </div>
        </div>

        {/* SWITCHER ROLE */}
        <div style={{ display: 'flex', backgroundColor: '#0f291e', padding: '4px', borderRadius: '30px', border: '1px solid #2d523e' }}>
          <button
            onClick={() => setRole('BK')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: role === 'BK' ? '#3b82f6' : 'transparent',
              color: role === 'BK' ? '#ffffff' : '#a7f3d0',
              transition: 'all 0.2s'
            }}
          >
            🧠 Panel Guru BK
          </button>
          <button
            onClick={() => setRole('PIKET')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: role === 'PIKET' ? '#22c55e' : 'transparent',
              color: role === 'PIKET' ? '#ffffff' : '#a7f3d0',
              transition: 'all 0.2s'
            }}
          >
            📋 Panel Guru Piket
          </button>
        </div>

        {/* PROFILE INFO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: role === 'BK' ? '#bfdbfe' : '#fef08a', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
            {role === 'BK' ? 'BK' : 'PK'}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{role === 'BK' ? 'Bu Rahma, S.Psi' : 'Pak Mulyana, S.Pd'}</div>
            <div style={{ fontSize: '11px', color: '#d1fae5' }}>{role === 'BK' ? 'Guru BK / Konselor' : 'Guru Piket Hari Ini'}</div>
          </div>
        </div>
      </nav>

      {/* 📌 MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 20px' }}>
        
        {/* ========================================================================= */}
        {/* DASHBOARD GURU BK                                                         */}
        {/* ========================================================================= */}
        {role === 'BK' && (
          <div>
            {/* STATISTIK BK */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>💬 CURHAT ANONIM</span>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '4px' }}>{dataCurhat.length} Pesan</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>👤 KONSELING INDIVIDUAL</span>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#047857', marginTop: '4px' }}>{dataKonselingInd.length} Sesi</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>🏠 AGENDA HOME VISIT</span>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#b45309', marginTop: '4px' }}>{dataHomeVisit.length} Siswa</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>📞 PANGGILAN ORTU</span>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#be123c', marginTop: '4px' }}>{dataPanggilanOrtu.length} Surat</div>
              </div>
            </div>

            {/* TAB MENU GURU BK */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
              {[
                { id: 'curhat', label: '💬 Curhat Anonim Siswa' },
                { id: 'konseling_ind', label: '👤 Konseling Individual' },
                { id: 'home_visit', label: '🏠 Agenda Home Visit' },
                { id: 'panggilan_ortu', label: '📞 Pemanggilan Orang Tua' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabBK(tab.id as any)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: tabBK === tab.id ? '#1b3b2b' : '#ffffff',
                    color: tabBK === tab.id ? '#ffffff' : '#1b3b2b',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* KONTEN TAB GURU BK */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #b5d8b6', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
              
              {/* TAB 1: CURHAT ANONIM */}
              {tabBK === 'curhat' && (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '18px' }}>💬 Pesan Curhat Anonim dari Siswa</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>Judul Curhatan</th>
                        <th style={{ padding: '12px' }}>Tanggal Masuk</th>
                        <th style={{ padding: '12px' }}>Jenis Request</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Aksi Konselor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataCurhat.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.judul}</td>
                          <td style={{ padding: '12px' }}>{item.tanggal}</td>
                          <td style={{ padding: '12px' }}>{item.jenis}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: item.status === 'Perlu Respon' ? '#fef3c7' : '#d1fae5', color: item.status === 'Perlu Respon' ? '#92400e' : '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => { setModalCurhatDetail(item); setTextBalasan(item.balasan); }}
                              style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              📂 Buka & Balas
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: KONSELING INDIVIDUAL */}
              {tabBK === 'konseling_ind' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '18px' }}>👤 Sesi Konseling Individual</h3>
                    <button
                      onClick={() => setShowModalAddKonseling(true)}
                      style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Buat Agendakan Konseling
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>Nama Siswa</th>
                        <th style={{ padding: '12px' }}>Tanggal Konseling</th>
                        <th style={{ padding: '12px' }}>Topik / Masalah</th>
                        <th style={{ padding: '12px' }}>Status Sesi</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataKonselingInd.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                          <td style={{ padding: '12px' }}>{item.tanggal}</td>
                          <td style={{ padding: '12px' }}>{item.topik}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: item.status === 'SELESAI' ? '#d1fae5' : '#e0f2fe', color: item.status === 'SELESAI' ? '#065f46' : '#0369a1', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleStatusKonseling(item.id)}
                              style={{ backgroundColor: item.status === 'TERJADWAL' ? '#16a34a' : '#6b7280', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              {item.status === 'TERJADWAL' ? '✔ Tandai Selesai' : '🔄 Buka Kembali'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: HOME VISIT */}
              {tabBK === 'home_visit' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '18px' }}>🏠 Agenda Kunjungan Rumah (Home Visit)</h3>
                    <button
                      onClick={() => setShowModalAddHomeVisit(true)}
                      style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Buat Surat Tugas Home Visit
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>Nama Siswa</th>
                        <th style={{ padding: '12px' }}>Alamat Rumah</th>
                        <th style={{ padding: '12px' }}>Tanggal Visit</th>
                        <th style={{ padding: '12px' }}>Alasan Kunjungan</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Cetak Surat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataHomeVisit.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                          <td style={{ padding: '12px' }}>{item.alamat}</td>
                          <td style={{ padding: '12px' }}>{item.tanggal}</td>
                          <td style={{ padding: '12px' }}>{item.alasan}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewSurat({ judul: `SURAT TUGAS HOME VISIT - ${item.nama}`, detail: `Berdasarkan pertimbangan ketidakhadiran, Guru BK/Konselor ditugaskan mengunjungi kediaman ${item.nama} di ${item.alamat} pada tanggal ${item.tanggal} dengan alasan: ${item.alasan}.` })}
                              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              🖨️ Cetak Surat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: PANGGILAN ORTU */}
              {tabBK === 'panggilan_ortu' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '18px' }}>📞 Pemanggilan Orang Tua / Wali Siswa</h3>
                    <button
                      onClick={() => setShowModalAddOrtu(true)}
                      style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Buat Surat Panggilan
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>Nama Siswa</th>
                        <th style={{ padding: '12px' }}>Orang Tua / Wali</th>
                        <th style={{ padding: '12px' }}>Tanggal Pertemuan</th>
                        <th style={{ padding: '12px' }}>Alasan Pemanggilan</th>
                        <th style={{ padding: '12px' }}>Status Surat</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Cetak Surat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataPanggilanOrtu.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                          <td style={{ padding: '12px' }}>{item.ortu}</td>
                          <td style={{ padding: '12px' }}>{item.tanggal}</td>
                          <td style={{ padding: '12px' }}>{item.alasan}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => setPreviewSurat({ judul: `SURAT PEMANGGILAN ORANG TUA - ${item.nama}`, detail: `Kepada Yth. ${item.ortu} (Orang Tua/Wali dari ${item.nama}), Mengharap kehadiran Bapak/Ibu di Ruang BK SMK Budi Bakti Ciwidey pada tanggal ${item.tanggal} terkait permasalahan: ${item.alasan}.` })}
                              style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              🖨️ Cetak Surat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD GURU PIKET                                                     */}
        {/* ========================================================================= */}
        {role === 'PIKET' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #b5d8b6' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b' }}>⏰ Catatan Keterlambatan Siswa Hari Ini</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Jam Datang</th>
                    <th style={{ padding: '12px' }}>Alasan Terlambat</th>
                    <th style={{ padding: '12px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTerlambat.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                      <td style={{ padding: '12px' }}>{item.kelas}</td>
                      <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>{item.jam}</td>
                      <td style={{ padding: '12px' }}>{item.alasan}</td>
                      <td style={{ padding: '12px' }}>
                        <button style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Cetak Surat Masuk</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 🔮 MODAL POPUP BERFUNGSI UNTUK SETIAP AGENDA BK                            */}
      {/* ========================================================================= */}

      {/* 1. MODAL BUKA & BALAS CURHAT */}
      {modalCurhatDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '20px', maxWidth: '500px', width: '90%', border: '2px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1b3b2b' }}>💬 Detail Curhat Anonim</h3>
            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              <strong>Judul:</strong> {modalCurhatDetail.judul} <br />
              <strong>Pesan:</strong> "{modalCurhatDetail.isi}"
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Tulis Balasan Guru BK / Konselor:</label>
            <textarea value={textBalasan} onChange={(e) => setTextBalasan(e.target.value)} rows={4} placeholder="Ketik jawaban konseling di sini..." style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setModalCurhatDetail(null)} style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
              <button onClick={handleBalasCurhat} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Kirim Balasan</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL AGENDAKAN KONSELING INDIVIDUAL */}
      {showModalAddKonseling && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '20px', maxWidth: '450px', width: '90%', border: '2px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b' }}>👤 Agendakan Konseling Individual</h3>
            <form onSubmit={handleSimpanKonseling}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Siswa & Kelas</label>
                <input required placeholder="Contoh: Rian (XI RPL 2)" value={formKonseling.nama} onChange={(e) => setFormKonseling({ ...formKonseling, nama: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Pelaksanaan</label>
                <input required placeholder="Contoh: 05 Agust 2026" value={formKonseling.tanggal} onChange={(e) => setFormKonseling({ ...formKonseling, tanggal: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Topik Bahasan</label>
                <input required placeholder="Contoh: Motivasi Belajar" value={formKonseling.topik} onChange={(e) => setFormKonseling({ ...formKonseling, topik: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddKonseling(false)} style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL TAMBAH HOME VISIT */}
      {showModalAddHomeVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '20px', maxWidth: '450px', width: '90%', border: '2px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b' }}>🏠 Agendakan Home Visit Baru</h3>
            <form onSubmit={handleSimpanHomeVisit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Siswa & Kelas</label>
                <input required placeholder="Nama Siswa" value={formHomeVisit.nama} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, nama: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Alamat Rumah</label>
                <input required placeholder="Alamat Lengkap" value={formHomeVisit.alamat} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alamat: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Visit</label>
                <input required placeholder="Contoh: 08 Agust 2026" value={formHomeVisit.tanggal} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, tanggal: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Alasan Kunjungan</label>
                <input required placeholder="Alasan Kunjungan" value={formHomeVisit.alasan} onChange={(e) => setFormHomeVisit({ ...formHomeVisit, alasan: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddHomeVisit(false)} style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Buat Surat Tugas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL TAMBAH PANGGILAN ORTU */}
      {showModalAddOrtu && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '20px', maxWidth: '450px', width: '90%', border: '2px solid #b5d8b6' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b' }}>📞 Buat Surat Panggilan Orang Tua</h3>
            <form onSubmit={handleSimpanPanggilanOrtu}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Siswa & Kelas</label>
                <input required placeholder="Nama Siswa" value={formOrtu.nama} onChange={(e) => setFormOrtu({ ...formOrtu, nama: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Orang Tua / Wali</label>
                <input required placeholder="Bpk / Ibu..." value={formOrtu.ortu} onChange={(e) => setFormOrtu({ ...formOrtu, ortu: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Pertemuan</label>
                <input required placeholder="Contoh: 10 Agust 2026" value={formOrtu.tanggal} onChange={(e) => setFormOrtu({ ...formOrtu, tanggal: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Alasan Pemanggilan</label>
                <input required placeholder="Alasan" value={formOrtu.alasan} onChange={(e) => setFormOrtu({ ...formOrtu, alasan: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModalAddOrtu(false)} style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                <button type="submit" style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Terbitkan Surat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL PREVIEW SURAT */}
      {previewSurat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '20px', maxWidth: '520px', width: '90%', border: '2px solid #1b3b2b', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
            <h3 style={{ margin: '0 0 14px 0', color: '#1b3b2b', fontSize: '16px' }}>{previewSurat.judul}</h3>
            <p style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px', lineHeight: '1.6', color: '#374151', textAlign: 'left' }}>
              {previewSurat.detail}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => setPreviewSurat(null)} style={{ backgroundColor: '#e5e7eb', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Tutup</button>
              <button onClick={() => { alert('Mencetak surat...'); setPreviewSurat(null); }} style={{ backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Cetak Dokumen</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}