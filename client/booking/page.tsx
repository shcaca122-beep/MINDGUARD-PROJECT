'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

const GURU_BK_LIST = [
    { id: 1, nama: 'Bu Hj Eli, S.Pd', jabatan: 'Guru BK Utama', foto: '👩‍🏫' },
    { id: 2, nama: 'Pak Cecep, S.Pd', jabatan: 'Guru BK / Kedisiplinan', foto: '👨‍🏫' },
];

export default function BookingPage() {
    const [namaSiswa, setNamaSiswa] = useState('');
    const [kelas, setKelas] = useState('X BRP 1');
    const [guruPilihan, setGuruPilihan] = useState(GURU_BK_LIST[0].nama);
    const [tanggal, setTanggal] = useState('');
    const [jam, setJam] = useState('08:00 WIB');
    const [topik, setTopik] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dataBooking, setDataBooking] = useState<any[]>([]);

    // Ambil Data Booking dari Database
    const fetchBookingSiswa = async () => {
        try {
            const { data, error } = await supabase
                .from('layanan_siswa')
                .select('*')
                .eq('layanan', 'KONSELING')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDataBooking(data);
            }
        } catch (err) {
            console.error('Gagal mengambil data booking:', err);
        }
    };

    useEffect(() => {
        fetchBookingSiswa();
    }, []);

    // Simpan Booking ke Supabase
    const handleSubmitBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!namaSiswa.trim() || !tanggal || !topik.trim()) {
            alert('Mohon lengkapi Nama, Tanggal, dan Topik Konseling!');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from('layanan_siswa').insert([
                {
                    layanan: 'KONSELING',
                    nama_siswa: namaSiswa,
                    kelas: kelas,
                    judul_pesan: `Konseling: ${topik}`,
                    topik: `[Guru BK: ${guruPilihan}] [Waktu: ${jam}] - ${topik}`,
                    tanggal: `${tanggal} ${jam}`,
                    status: 'TERJADWAL',
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;

            alert('✅ Permohonan Konseling Berhasil Dikirim!');
            setTopik('');
            fetchBookingSiswa();
        } catch (err: any) {
            alert('❌ Gagal membuat jadwal: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', backgroundColor: '#d1f2d9' }}>

            {/* 🟢 SIDEBAR PERMANEN */}
            <Sidebar />

            {/* ⚪ KONTEN UTAMA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>

                {/* TOP BAR */}
                <div style={{ backgroundColor: '#ffffff', padding: '16px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#1b3b2b', fontWeight: 'bold' }}>
                        📅 Layanan Booking Konseling BK
                    </h2>
                </div>

                {/* BODY CONTENT */}
                <div style={{ flex: 1, padding: '30px 20px', maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

                    {/* PILIH GURU BK */}
                    <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '18px' }}>1. Pilih Guru BK</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                        {GURU_BK_LIST.map((guru) => (
                            <div
                                key={guru.id}
                                onClick={() => setGuruPilihan(guru.nama)}
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: guruPilihan === guru.nama ? '2.5px solid #1b3b2b' : '1px solid #cbd5e1',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ fontSize: '32px' }}>{guru.foto}</span>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#1b3b2b', fontSize: '14px' }}>{guru.nama}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{guru.jabatan}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FORM ISIAN */}
                    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #b5d8b6', marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#1b3b2b', fontSize: '18px' }}>2. Isi Detail Konseling</h3>

                        <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Nama Siswa:</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nama lengkap"
                                        value={namaSiswa}
                                        onChange={(e) => setNamaSiswa(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Kelas:</label>
                                    <select
                                        value={kelas}
                                        onChange={(e) => setKelas(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box', backgroundColor: '#fff' }}
                                    >
                                        <option value="X BRP 1">X BRP 1</option>
                                        <option value="X BRP 2">X BRP 2</option>
                                        <option value="XI AKL 1">XI AKL 1</option>
                                        <option value="XI MPLB 1">XI MPLB 1</option>
                                        <option value="XII MPLB 1">XII MPLB 1</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Tanggal Konseling:</label>
                                    <input
                                        type="date"
                                        required
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Pilih Jam:</label>
                                    <select
                                        value={jam}
                                        onChange={(e) => setJam(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box', backgroundColor: '#fff' }}
                                    >
                                        <option value="08:00 WIB">08:00 WIB (Istirahat 1)</option>
                                        <option value="09:30 WIB">09:30 WIB (Jam KBM)</option>
                                        <option value="12:00 WIB">12:00 WIB (Istirahat 2)</option>
                                        <option value="14:00 WIB">14:00 WIB (Pulang Sekolah)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1b3b2b' }}>Topik / Alasan Konseling:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Konsultasi Karir, Belajar, Masalah Pribadi"
                                    value={topik}
                                    onChange={(e) => setTopik(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    backgroundColor: '#1b3b2b',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                {isLoading ? '⌛ Memproses...' : '📨 Kirim Permohonan Konseling'}
                            </button>

                        </form>
                    </div>

                    {/* TABEL RIWAYAT BOOKING */}
                    <h3 style={{ margin: '0 0 12px 0', color: '#1b3b2b', fontSize: '18px' }}>📋 Riwayat Booking Anda</h3>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1b3b2b', color: '#ffffff' }}>
                                    <th style={{ padding: '10px' }}>Nama</th>
                                    <th style={{ padding: '10px' }}>Jadwal</th>
                                    <th style={{ padding: '10px' }}>Detail</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataBooking.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
                                            Belum ada data booking.
                                        </td>
                                    </tr>
                                ) : (
                                    dataBooking.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nama_siswa} ({item.kelas})</td>
                                            <td style={{ padding: '10px' }}>{item.tanggal}</td>
                                            <td style={{ padding: '10px' }}>{item.topik}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                                                    {item.status || 'TERJADWAL'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* FOOTER */}
                <footer style={{ backgroundColor: '#1b3b2b', color: '#ffffff', textAlign: 'center', padding: '15px', marginTop: 'auto' }}>
                    <p style={{ margin: '0', fontSize: '11px', color: '#a7f3d0' }}>&copy; 2026 Ruang Tenang SMK Budi Bakti Ciwidey</p>
                </footer>

            </div>
        </div>
    );
}