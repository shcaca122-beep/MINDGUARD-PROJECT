
'use client';
import { useState, useEffect } from 'react';

// JADWAL DEFAULT (BISA DISUKSESKAN DENGAN INPUT MANUAL)
const JADWAL_DEFAULT = [
  { hari: 'Senin', nama: 'Bu Hj Eli, S.Pd', inisial: 'EL' },
  { hari: 'Selasa', nama: 'Pak Cecep , S.Pd', inisial: 'ML' },
  { hari: 'Rabu', nama: 'Bu Widia, S.Pd', inisial: 'NR' },
  { hari: 'Kamis', nama: 'Pak Aam Nurdian, S.Pd', inisial: 'DK' },
  { hari: 'Jumat', nama: 'Bu Agistina, S.Pd', inisial: 'SN' },
  { hari: 'Sabtu', nama: 'Bu Amalia, S.Pd', inisial: 'AS' },
];

export default function DashboardPiket() {
  const [tabPiket, setTabPiket] = useState<'terlambat' | 'izin_keluar' | 'uks' | 'jurnal'>('terlambat');

  // STATE PROFILE GURU PIKET AKTIF
  const [guruAktif, setGuruAktif] = useState({
    nama: 'Bu Hj Eli, S.Pd',
    inisial: 'EL',
    hari: 'Senin',
    isManual: false
  });

  // STATE MODAL EDIT/INPUT GURU
  const [showModalGantiGuru, setShowModalGantiGuru] = useState(false);
  const [inputNamaGuru, setInputNamaGuru] = useState('');
  const [inputHari, setInputHari] = useState('Senin');

  // DETEKSI HARI OTOMATIS SAAT PERTAMA KALI DIBUKA
  useEffect(() => {
    const listHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const namaHariReal = listHari[now.getDay()];
    const hariTerpilih = namaHariReal === 'Minggu' ? 'Senin' : namaHariReal;

    const matchGuru = JADWAL_DEFAULT.find(g => g.hari === hariTerpilih);
    if (matchGuru) {
      setGuruAktif({
        nama: matchGuru.nama,
        inisial: matchGuru.inisial,
        hari: matchGuru.hari,
        isManual: false
      });
    }
  }, []);

  // HANDLER SIMPAN INPUT GURU MANUAL
  const handleSimpanGuruManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNamaGuru.trim()) return;

    // Buat inisial otomatis dari 2 huruf depan nama
    const kata = inputNamaGuru.trim().split(' ');
    let inisialBaru = kata[0].charAt(0).toUpperCase();
    if (kata.length > 1) {
      inisialBaru += kata[1].charAt(0).toUpperCase();
    } else if (inputNamaGuru.length > 1) {
      inisialBaru += inputNamaGuru.charAt(1).toUpperCase();
    }

    setGuruAktif({
      nama: inputNamaGuru,
      inisial: inisialBaru,
      hari: inputHari,
      isManual: true
    });

    setShowModalGantiGuru(false);
    setInputNamaGuru('');
  };

  // HANDLER PILIH JADWAL DROPDOWN
  const handleGantiJadwalDropdown = (namaHari: string) => {
    const selected = JADWAL_DEFAULT.find(g => g.hari === namaHari);
    if (selected) {
      setGuruAktif({
        nama: selected.nama,
        inisial: selected.inisial,
        hari: selected.hari,
        isManual: false
      });
    }
  };

  // DATA DEMO PERIZINAN
  const [dataTerlambat, setDataTerlambat] = useState([
    { id: '1', nama: 'Risya', kelas: 'XI-1', jenis: 'SAKIT', periode: '30 Juli 2026 s.d 31 Juli 2026', alasan: 'Demam tinggi', status: 'PENDING' },
    { id: '2', nama: 'Tejar', kelas: 'XI-2', jenis: 'IZIN', periode: '01 Agust 2026 s.d 01 Agust 2026', alasan: 'Acara keluarga', status: 'PENDING' },
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

  const handleApproveTerlambat = (id: string) => {
    setDataTerlambat(dataTerlambat.map(item => item.id === id ? { ...item, status: 'DISETUJUI' } : item));
  };

  return (
    <div style={{ backgroundColor: '#cbe3cd', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1f2937' }}>
      
      {/* NAVBAR GURU PIKET DENGAN PROFILE INPUT */}
      <nav style={{ backgroundColor: '#1b3b2b', color: '#ffffff', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>MindGuard</div>
            <span style={{ fontSize: '11px', backgroundColor: '#22c55e', padding: '3px 8px', borderRadius: '12px', color: '#ffffff', fontWeight: 'bold' }}>Panel Utama Guru Piket</span>
          </div>
        </div>

        {/* PROFILE GURU PIKET DENGAN TOMBOL INPUT MANUAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#12291e', padding: '6px 14px', borderRadius: '30px', border: '1px solid #2d523e' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#fef08a', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
            {guruAktif.inisial}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!guruAktif.isManual ? (
              <select
                value={guruAktif.hari}
                onChange={(e) => handleGantiJadwalDropdown(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                {JADWAL_DEFAULT.map((j) => (
                  <option key={j.hari} value={j.hari} style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    {j.nama} ({j.hari})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ffffff' }}>{guruAktif.nama}</span>
            )}
            
            <span style={{ fontSize: '11px', color: '#a7f3d0' }}>
              Guru Piket Hari {guruAktif.hari} {guruAktif.isManual && '(Input Manual)'}
            </span>
          </div>

          {/* TOMBOL INPUT / EDIT NAMA GURU */}
          <button
            onClick={() => {
              setInputNamaGuru(guruAktif.nama);
              setInputHari(guruAktif.hari);
              setShowModalGantiGuru(true);
            }}
            title="Input / Ganti Profil Guru Piket"
            style={{
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            ✏️ Input Guru
          </button>
        </div>
      </nav>

      {/* CONTAINER UTAMA */}
      <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 20px' }}>
        
        {/* STATISTIK PIKET */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>PERIZINAN SISWA</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#991b1b', marginTop: '4px' }}>{dataTerlambat.length} Siswa</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>IZIN KELUAR KELAS</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#b45309', marginTop: '4px' }}>{dataIzinKeluar.length} Pengajuan</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #b5d8b6' }}>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>SISWA DI UKS / SAKIT</span>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '4px' }}>{dataUKS.length} Orang</div>
          </div>
        </div>

        {/* TAB MENU PIKET */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
          {[
            { id: 'terlambat', label: '📝 Perizinan / Keterlambatan Siswa' },
            { id: 'izin_keluar', label: '🎟️ Izin Keluar Jam Pelajaran' },
            { id: 'uks', label: '🏥 Catatan Siswa UKS' },
            { id: 'jurnal', label: '📖 Jurnal Piket Harian' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabPiket(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: tabPiket === tab.id ? '#1b3b2b' : '#ffffff',
                color: tabPiket === tab.id ? '#ffffff' : '#1b3b2b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* KONTEN TAB */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #b5d8b6', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
          
          {tabPiket === 'terlambat' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#1b3b2b', fontSize: '18px' }}>📝 Pengajuan Perizinan Siswa</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Jenis</th>
                    <th style={{ padding: '12px' }}>Periode</th>
                    <th style={{ padding: '12px' }}>Alasan</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTerlambat.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama} ({item.kelas})</td>
                      <td style={{ padding: '12px' }}>{item.jenis}</td>
                      <td style={{ padding: '12px' }}>{item.periode}</td>
                      <td style={{ padding: '12px' }}>{item.alasan}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ backgroundColor: item.status === 'DISETUJUI' ? '#d1fae5' : '#fef3c7', color: item.status === 'DISETUJUI' ? '#065f46' : '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.status === 'PENDING' ? (
                          <button onClick={() => handleApproveTerlambat(item.id)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                            Setujui
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>✔ Disetujui</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tabPiket === 'izin_keluar' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '18px' }}>🎟️ Izin Keluar Jam Pelajaran</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Jam Keluar</th>
                    <th style={{ padding: '12px' }}>Alasan</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataIzinKeluar.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                      <td style={{ padding: '12px' }}>{item.kelas}</td>
                      <td style={{ padding: '12px' }}>{item.jamKeluar} s.d {item.jamKembali}</td>
                      <td style={{ padding: '12px' }}>{item.alasan}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ backgroundColor: item.status === 'DISETUJUI' ? '#d1fae5' : '#fef3c7', color: item.status === 'DISETUJUI' ? '#065f46' : '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.status === 'MENUNGGU' ? (
                          <button onClick={() => handleApproveIzin(item.id)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                            Izinkan
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>✔ Diizinkan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tabPiket === 'uks' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '18px' }}>🏥 Siswa Istirahat di UKS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b3b2b', color: '#fff' }}>
                    <th style={{ padding: '12px' }}>Nama Siswa</th>
                    <th style={{ padding: '12px' }}>Kelas</th>
                    <th style={{ padding: '12px' }}>Keluhan Utama</th>
                    <th style={{ padding: '12px' }}>Penanganan</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataUKS.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2f0e3' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.nama}</td>
                      <td style={{ padding: '12px' }}>{item.kelas}</td>
                      <td style={{ padding: '12px' }}>{item.keluhan}</td>
                      <td style={{ padding: '12px' }}>{item.penanganan}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tabPiket === 'jurnal' && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '18px' }}>📖 Catatan Jurnal Piket Harian ({guruAktif.nama})</h3>
              <textarea placeholder={`Tuliskan catatan kejadian penting atau situasi sekolah oleh ${guruAktif.nama} hari ini...`} rows={5} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box' }} />
              <button style={{ marginTop: '12px', backgroundColor: '#1b3b2b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>💾 Simpan Jurnal Piket</button>
            </div>
          )}

        </div>
      </main>

      {/* 🔮 MODAL INPUT / GANTI GURU PIKET MANUAL */}
      {showModalGantiGuru && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '20px', maxWidth: '420px', width: '90%', border: '2px solid #b5d8b6', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '18px' }}>✏️ Input Guru Piket Hari Ini</h3>
            
            <form onSubmit={handleSimpanGuruManual}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>Nama Guru Piket (Lengkap + Gelar)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bu Hj Eli, S.Pd / Pak Ahmad, M.Pd"
                  value={inputNamaGuru}
                  onChange={(e) => setInputNamaGuru(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>Hari Tugas Piket</label>
                <select
                  value={inputHari}
                  onChange={(e) => setInputHari(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModalGantiGuru(false)}
                  style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#1b3b2b', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Simpan Nama Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}




